import fs from "fs";
import path from "path";
import Papa from "papaparse";

const CSV_PATH = path.join(__dirname, "../public/data/estim-pop-dep-2023.csv");
const OUTPUT_PATH = path.join(__dirname, "../public/data/population.json");

const AGE_BRACKETS = ["0_19", "20_39", "40_59", "60_74", "75_plus"] as const;

const EXPECTED_CODES = [
  ...Array.from({ length: 95 }, (_, i) => i + 1)
    .filter((n) => n !== 20)
    .map(String),
  "2A",
  "2B",
  "971",
  "972",
  "973",
  "974",
  "976",
].sort();

function cleanNumber(x: string | number | null | undefined) {
  if (x === null || x === undefined) return null;
  const str = String(x).replace(/\s/g, "");
  if (str === "" || str.toLowerCase() === "nan") return null;
  return Number(str);
}

function buildStructuredRow(row: any) {
  return {
    id: row["Code"]?.trim(),
    nom: row["Nom"]?.trim(),
    ensemble: {
      "0_19": cleanNumber(row["0-19"]),
      "20_39": cleanNumber(row["20-39"]),
      "40_59": cleanNumber(row["40-59"]),
      "60_74": cleanNumber(row["60-74"]),
      "75_plus": cleanNumber(row["75+"]),
      total: cleanNumber(row["Total"]),
    },
    hommes: {
      "0_19": cleanNumber(row["0-19_1"]),
      "20_39": cleanNumber(row["20-39_1"]),
      "40_59": cleanNumber(row["40-59_1"]),
      "60_74": cleanNumber(row["60-74_1"]),
      "75_plus": cleanNumber(row["75+_1"]),
      total: cleanNumber(row["Total_1"]),
    },
    femmes: {
      "0_19": cleanNumber(row["0-19_2"]),
      "20_39": cleanNumber(row["20-39_2"]),
      "40_59": cleanNumber(row["40-59_2"]),
      "60_74": cleanNumber(row["60-74_2"]),
      "75_plus": cleanNumber(row["75+_2"]),
      total: cleanNumber(row["Total_2"]),
    },
  };
}

function validate(rows: ReturnType<typeof buildStructuredRow>[]): string[] {
  const errors: string[] = [];

  const seen = new Set<string>();
  for (const row of rows) {
    if (!row.id || !row.nom) {
      errors.push(`Ligne sans code ou nom valide : ${JSON.stringify(row)}`);
      continue;
    }
    if (seen.has(row.id)) errors.push(`Code département en double : ${row.id}`);
    seen.add(row.id);

    const brackets: (typeof AGE_BRACKETS[number] | "total")[] = [...AGE_BRACKETS, "total"];
    for (const bracket of brackets) {
      const h = row.hommes[bracket];
      const f = row.femmes[bracket];
      const e = row.ensemble[bracket];
      if (h === null || f === null || e === null) continue;
      if (h + f !== e) {
        errors.push(
          `${row.id} (${row.nom}) : incohérence sur "${bracket}" — hommes(${h}) + femmes(${f}) = ${h + f} ≠ ensemble(${e})`
        );
      }
    }
  }

  const actualCodes = [...seen].sort();
  const missing = EXPECTED_CODES.filter((c) => !seen.has(c));
  const unexpected = actualCodes.filter((c) => !EXPECTED_CODES.includes(c));
  if (missing.length) errors.push(`Départements manquants : ${missing.join(", ")}`);
  if (unexpected.length) errors.push(`Départements inattendus : ${unexpected.join(", ")}`);

  return errors;
}

function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌ Fichier introuvable : ${CSV_PATH}`);
    process.exit(1);
  }

  let csv = fs.readFileSync(CSV_PATH, "utf8");
  // La première ligne du CSV INSEE regroupe les colonnes par sexe (Ensemble/Hommes/Femmes) ; PapaParse n'a besoin que de la deuxième.
  const lines = csv.split("\n");
  csv = lines.slice(1).join("\n");

  const { data, errors: parseErrors } = Papa.parse(csv, {
    delimiter: ";",
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  if (parseErrors.length) {
    console.error("❌ Erreurs de parsing CSV :", parseErrors);
    process.exit(1);
  }

  const result = (data as any[])
    .filter((row) => {
      const dept_id = String(row["Code"] ?? "").trim();
      return /^\d+$/.test(dept_id) || ["2A", "2B", "971", "972", "973", "974", "976"].includes(dept_id);
    })
    .map(buildStructuredRow);

  const validationErrors = validate(result);
  if (validationErrors.length) {
    console.error(`❌ Validation échouée (${validationErrors.length} problème(s)) :`);
    for (const err of validationErrors) console.error(`  - ${err}`);
    console.error("population.json n'a pas été régénéré.");
    process.exit(1);
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2));
  console.log(`✅ population.json créé ! (${result.length} départements, validation OK)`);
}

main();

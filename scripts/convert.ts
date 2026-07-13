import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

const XLS_PATH = path.join(
  __dirname,
  "../public/data/estim-pop-dep-sexe-gca-1975-2026.xlsx"
);
const OUTPUT_PATH = path.join(__dirname, "../public/data/population.json");

const AGE_BRACKETS = ["0_19", "20_39", "40_59", "60_74", "75_plus"] as const;
const FIRST_DATA_ROW = 5;

// Colonnes (0-indexées) : 0=code, 1=nom, 2-7=Ensemble(0-19..75+,Total), 8-13=Hommes, 14-19=Femmes.
const COL = {
  code: 0,
  nom: 1,
  ensemble: { "0_19": 2, "20_39": 3, "40_59": 4, "60_74": 5, "75_plus": 6, total: 7 },
  hommes: { "0_19": 8, "20_39": 9, "40_59": 10, "60_74": 11, "75_plus": 12, total: 13 },
  femmes: { "0_19": 14, "20_39": 15, "40_59": 16, "60_74": 17, "75_plus": 18, total: 19 },
} as const;

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

function normalizeCode(raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  if (typeof raw === "number") return String(Math.trunc(raw));
  const s = String(raw).trim();
  // Les codes texte zéro-préfixés ("01") doivent rejoindre la même forme que le reste
  // du pipeline ("1") ; "2A"/"2B" ne matchent pas et passent tels quels.
  if (/^0\d+$/.test(s)) return String(parseInt(s, 10));
  return s;
}

function isDeptCode(code: string): boolean {
  return /^\d+$/.test(code) || code === "2A" || code === "2B";
}

function cleanNumber(x: unknown): number | null {
  if (x === null || x === undefined || x === "") return null;
  const n = typeof x === "number" ? x : Number(String(x).replace(/\s/g, ""));
  return Number.isFinite(n) ? n : null;
}

function buildStructuredRow(row: unknown[]) {
  const pick = (colMap: Record<string, number>) => ({
    "0_19": cleanNumber(row[colMap["0_19"]]),
    "20_39": cleanNumber(row[colMap["20_39"]]),
    "40_59": cleanNumber(row[colMap["40_59"]]),
    "60_74": cleanNumber(row[colMap["60_74"]]),
    "75_plus": cleanNumber(row[colMap["75_plus"]]),
    total: cleanNumber(row[colMap.total]),
  });

  return {
    id: normalizeCode(row[COL.code]),
    nom: String(row[COL.nom] ?? "").trim(),
    ensemble: pick(COL.ensemble),
    hommes: pick(COL.hommes),
    femmes: pick(COL.femmes),
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
  if (!fs.existsSync(XLS_PATH)) {
    console.error(`❌ Fichier introuvable : ${XLS_PATH}`);
    process.exit(1);
  }

  const workbook = XLSX.readFile(XLS_PATH);
  const yearSheets = workbook.SheetNames.filter((name) => /^\d{4}$/.test(name));
  if (yearSheets.length === 0) {
    console.error("❌ Aucune feuille au format année (YYYY) trouvée dans le classeur.");
    process.exit(1);
  }
  const latestYear = Math.max(...yearSheets.map(Number));

  const sheet = workbook.Sheets[String(latestYear)];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });

  const result = rows
    .slice(FIRST_DATA_ROW)
    .filter((row) => row && row.length > 0 && isDeptCode(normalizeCode(row[COL.code])))
    .map(buildStructuredRow);

  const validationErrors = validate(result);
  if (validationErrors.length) {
    console.error(`❌ Validation échouée (${validationErrors.length} problème(s)) :`);
    for (const err of validationErrors) console.error(`  - ${err}`);
    console.error("population.json n'a pas été régénéré.");
    process.exit(1);
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2));
  console.log(
    `✅ population.json créé ! (millésime ${latestYear}, ${result.length} départements, validation OK)`
  );
}

main();

import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

const XLS_PATH = path.join(__dirname, "../public/data/estim-pop-dep-sexe-gca-1975-2026.xlsx");
const OUTPUT_PATH = path.join(__dirname, "../public/data/population-history.json");
const POPULATION_LATEST_PATH = path.join(__dirname, "../public/data/population.json");

// Colonnes (0-indexées) : 0=code, 1=nom, 2-7=Ensemble(0-19..75+,Total), 8-13=Hommes, 14-19=Femmes.
const COL = { code: 0, nom: 1, ensembleTotal: 7, hommesTotal: 13, femmesTotal: 19 };
const FIRST_DATA_ROW = 5;

const METRO_CODES = [
  ...Array.from({ length: 95 }, (_, i) => i + 1)
    .filter((n) => n !== 20)
    .map(String),
  "2A",
  "2B",
];

// La couverture DOM varie dans le temps (vérifié feuille par feuille, pas supposé) :
// pas de DOM avant 1990, Mayotte (976) absente avant 2014.
function expectedCodesForYear(year: number): string[] {
  if (year < 1990) return METRO_CODES;
  if (year < 2014) return [...METRO_CODES, "971", "972", "973", "974"];
  return [...METRO_CODES, "971", "972", "973", "974", "976"];
}

function normalizeCode(raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  if (typeof raw === "number") return String(Math.trunc(raw));
  const s = String(raw).trim();
  // Les codes texte zéro-préfixés ("01") doivent rejoindre la même forme
  // que le reste du pipeline ("1") ; "2A"/"2B" ne matchent pas et passent tels quels.
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

type HistoryEntry = { id: string; nom: string; series: Record<string, number> };

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

  const entries = new Map<string, HistoryEntry>();
  const errors: string[] = [];

  for (const sheetName of yearSheets) {
    const year = Number(sheetName);
    const sheet = workbook.Sheets[sheetName];
    const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });

    const seenThisYear = new Set<string>();

    for (let r = FIRST_DATA_ROW; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;

      const code = normalizeCode(row[COL.code]);
      if (!isDeptCode(code)) continue; // ignore lignes de résumé / notes

      const nom = String(row[COL.nom] ?? "").trim();
      const ensembleTotal = cleanNumber(row[COL.ensembleTotal]);
      const hommesTotal = cleanNumber(row[COL.hommesTotal]);
      const femmesTotal = cleanNumber(row[COL.femmesTotal]);

      if (seenThisYear.has(code)) {
        errors.push(`${year} : code département en double (${code})`);
      }
      seenThisYear.add(code);

      if (!nom || ensembleTotal === null) {
        errors.push(`${year} : ligne invalide pour le code ${code}`);
        continue;
      }
      if (hommesTotal !== null && femmesTotal !== null && hommesTotal + femmesTotal !== ensembleTotal) {
        errors.push(
          `${year} : ${code} (${nom}) — hommes(${hommesTotal}) + femmes(${femmesTotal}) = ${hommesTotal + femmesTotal} ≠ ensemble(${ensembleTotal})`
        );
      }

      const entry = entries.get(code) ?? { id: code, nom, series: {} };
      entry.nom = nom;
      entry.series[year] = ensembleTotal;
      entries.set(code, entry);
    }

    const expected = expectedCodesForYear(year);
    const missing = expected.filter((c) => !seenThisYear.has(c));
    const unexpected = [...seenThisYear].filter((c) => !expected.includes(c));
    if (missing.length) errors.push(`${year} : départements manquants — ${missing.join(", ")}`);
    if (unexpected.length) errors.push(`${year} : départements inattendus — ${unexpected.join(", ")}`);
  }

  // Validation croisée : population.json (millésime le plus récent, régénéré par convert.ts)
  // et cette série historique (xls) partent de la même donnée source par des chemins différents.
  if (fs.existsSync(POPULATION_LATEST_PATH)) {
    const populationLatest = JSON.parse(fs.readFileSync(POPULATION_LATEST_PATH, "utf8")) as {
      id: string;
      ensemble: { total: number | null };
    }[];
    const latestYear = Math.max(...yearSheets.map(Number));
    const byId = new Map(populationLatest.map((d) => [d.id, d.ensemble.total]));
    for (const entry of entries.values()) {
      const expectedLatest = byId.get(entry.id);
      const actualLatest = entry.series[String(latestYear)];
      if (expectedLatest != null && actualLatest != null && expectedLatest !== actualLatest) {
        errors.push(
          `Incohérence avec population.json pour ${entry.id} (${entry.nom}) en ${latestYear} : ${actualLatest} ≠ ${expectedLatest}`
        );
      }
    }
  }

  if (errors.length) {
    console.error(`❌ Validation échouée (${errors.length} problème(s)) :`);
    for (const err of errors) console.error(`  - ${err}`);
    console.error("population-history.json n'a pas été régénéré.");
    process.exit(1);
  }

  const result = [...entries.values()].sort((a, b) => a.id.localeCompare(b.id));
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2));
  console.log(
    `✅ population-history.json créé ! (${result.length} départements, ${yearSheets.length} années, validation OK)`
  );
}

main();

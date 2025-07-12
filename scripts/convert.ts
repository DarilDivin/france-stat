import fs from "fs";
import path from "path";
import Papa from "papaparse";

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

const csvPath = path.join(__dirname, "../public/data/estim-pop-dep-2023.csv");
let csv = fs.readFileSync(csvPath, "utf8");
const lines = csv.split("\n");
csv = lines.slice(1).join("\n");

const { data } = Papa.parse(csv, {
  delimiter: ";",
  header: true,
  skipEmptyLines: true,
  dynamicTyping: false,
});

const result = (data as any[]).filter(row => {
  const dept_id = String(row["Code"] ?? "").trim();
  return /^\d+$/.test(dept_id) || ["2A", "2B", "971", "972", "973", "974", "976"].includes(dept_id);
}).map(buildStructuredRow);

fs.writeFileSync(path.join(__dirname, "../public/data/population.json"), JSON.stringify(result, null, 2));

console.log("✅ population.json créé !");

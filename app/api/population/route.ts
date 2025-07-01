// import type { NextApiRequest, NextApiResponse } from "next";
// import fs from "fs";
// import path from "path";
// import Papa from "papaparse";


// function cleanNumber(x: string | number | null | undefined) {
//   if (x === null || x === undefined) return null;
//   const str = String(x).replace(/\s/g, "");
//   if (str === "" || str.toLowerCase() === "nan") return null;
//   return Number(str);
// }

// function buildStructuredRow(row: any) {
//   return {
//     id: row["Départements_Code"]?.trim(),
//     nom: row["Départements_Nom"]?.trim(),
//     ensemble: {
//       "0_19": cleanNumber(row["Ensemble_0-19"]),
//       "20_39": cleanNumber(row["Ensemble_20-39"]),
//       "40_59": cleanNumber(row["Ensemble_40-59"]),
//       "60_74": cleanNumber(row["Ensemble_60-74"]),
//       "75_plus": cleanNumber(row["Ensemble_75+"]),
//       total: cleanNumber(row["Ensemble_Total"]),
//     },
//     hommes: {
//       "0_19": cleanNumber(row["Hommes_0-19"]),
//       "20_39": cleanNumber(row["Hommes_20-39"]),
//       "40_59": cleanNumber(row["Hommes_40-59"]),
//       "60_74": cleanNumber(row["Hommes_60-74"]),
//       "75_plus": cleanNumber(row["Hommes_75+"]),
//       total: cleanNumber(row["Hommes_Total"]),
//     },
//     femmes: {
//       "0_19": cleanNumber(row["Femmes_0-19"]),
//       "20_39": cleanNumber(row["Femmes_20-39"]),
//       "40_59": cleanNumber(row["Femmes_40-59"]),
//       "60_74": cleanNumber(row["Femmes_60-74"]),
//       "75_plus": cleanNumber(row["Femmes_75+"]),
//       total: cleanNumber(row["Femmes_Total"]),
//     },
//   };
// }

// export default function handler(req: NextApiRequest, res: NextApiResponse) {
//   const csvPath = path.join(process.cwd(), "public", "data", "estim-pop-dep-2023.csv");
//   const csv = fs.readFileSync(csvPath, "utf8");
//   const { data } = Papa.parse(csv, { header: true, skipEmptyLines: true });

//   // Filtrage des départements valides
//   const result = (data as any[]).filter(row => {
//     const dept_id = String(row["Départements_Code"] ?? "").trim();
//     return /^\d+$/.test(dept_id) || ["2A", "2B", "971", "972", "973", "974", "976"].includes(dept_id);
//   }).map(buildStructuredRow);

//   res.status(200).json(result);
// }


// import fs from "fs";
// import path from "path";
// import Papa from "papaparse";

// function cleanNumber(x: string | number | null | undefined) {
//   if (x === null || x === undefined) return null;
//   const str = String(x).replace(/\s/g, "");
//   if (str === "" || str.toLowerCase() === "nan") return null;
//   return Number(str);
// }

// function buildStructuredRow(row: any) {
//   return {
//     id: row["Départements_Code"]?.trim(),
//     nom: row["Départements_Nom"]?.trim(),
//     ensemble: {
//       "0_19": cleanNumber(row["Ensemble_0-19"]),
//       "20_39": cleanNumber(row["Ensemble_20-39"]),
//       "40_59": cleanNumber(row["Ensemble_40-59"]),
//       "60_74": cleanNumber(row["Ensemble_60-74"]),
//       "75_plus": cleanNumber(row["Ensemble_75+"]),
//       total: cleanNumber(row["Ensemble_Total"]),
//     },
//     hommes: {
//       "0_19": cleanNumber(row["Hommes_0-19"]),
//       "20_39": cleanNumber(row["Hommes_20-39"]),
//       "40_59": cleanNumber(row["Hommes_40-59"]),
//       "60_74": cleanNumber(row["Hommes_60-74"]),
//       "75_plus": cleanNumber(row["Hommes_75+"]),
//       total: cleanNumber(row["Hommes_Total"]),
//     },
//     femmes: {
//       "0_19": cleanNumber(row["Femmes_0-19"]),
//       "20_39": cleanNumber(row["Femmes_20-39"]),
//       "40_59": cleanNumber(row["Femmes_40-59"]),
//       "60_74": cleanNumber(row["Femmes_60-74"]),
//       "75_plus": cleanNumber(row["Femmes_75+"]),
//       total: cleanNumber(row["Femmes_Total"]),
//     },
//   };
// }

// // App Router: exporte une fonction GET
// export async function GET() {
//   const csvPath = path.join(process.cwd(), "public", "data", "estim-pop-dep-2023.csv");
//   const csv = fs.readFileSync(csvPath, "utf8");
//   const { data } = Papa.parse(csv, { header: true, skipEmptyLines: true });

//   const result = (data as any[]).filter(row => {
//     const dept_id = String(row["Départements_Code"] ?? "").trim();
//     return /^\d+$/.test(dept_id) || ["2A", "2B", "971", "972", "973", "974", "976"].includes(dept_id);
//   }).map(buildStructuredRow);

//   return Response.json(result);
// }


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

export async function GET() {
  const csvPath = path.join(process.cwd(), "public", "data", "estim-pop-dep-2023.csv");
  let csv = fs.readFileSync(csvPath, "utf8");

  // Ignore la première ligne (groupes)
  const lines = csv.split("\n");
  csv = lines.slice(1).join("\n");

  // Parse avec PapaParse
  const { data, meta } = Papa.parse(csv, {
    delimiter: ";",
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  // Renomme les colonnes dupliquées (PapaParse ajoute _1, _2, ...)
  // Ex: "0-19", "0-19_1", "0-19_2"
  // Donc buildStructuredRow doit utiliser ces noms

  // Filtre les lignes valides (code numérique ou DOM)
  const result = (data as any[]).filter(row => {
    const dept_id = String(row["Code"] ?? "").trim();
    return /^\d+$/.test(dept_id) || ["2A", "2B", "971", "972", "973", "974", "976"].includes(dept_id);
  }).map(buildStructuredRow);

  return Response.json(result);
}
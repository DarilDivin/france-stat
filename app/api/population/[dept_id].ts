import type { NextApiRequest, NextApiResponse } from "next";
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
    id: row["Départements_Code"]?.trim(),
    nom: row["Départements_Nom"]?.trim(),
    ensemble: {
      "0_19": cleanNumber(row["Ensemble_0-19"]),
      "20_39": cleanNumber(row["Ensemble_20-39"]),
      "40_59": cleanNumber(row["Ensemble_40-59"]),
      "60_74": cleanNumber(row["Ensemble_60-74"]),
      "75_plus": cleanNumber(row["Ensemble_75+"]),
      total: cleanNumber(row["Ensemble_Total"]),
    },
    hommes: {
      "0_19": cleanNumber(row["Hommes_0-19"]),
      "20_39": cleanNumber(row["Hommes_20-39"]),
      "40_59": cleanNumber(row["Hommes_40-59"]),
      "60_74": cleanNumber(row["Hommes_60-74"]),
      "75_plus": cleanNumber(row["Hommes_75+"]),
      total: cleanNumber(row["Hommes_Total"]),
    },
    femmes: {
      "0_19": cleanNumber(row["Femmes_0-19"]),
      "20_39": cleanNumber(row["Femmes_20-39"]),
      "40_59": cleanNumber(row["Femmes_40-59"]),
      "60_74": cleanNumber(row["Femmes_60-74"]),
      "75_plus": cleanNumber(row["Femmes_75+"]),
      total: cleanNumber(row["Femmes_Total"]),
    },
  };
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { dept_id } = req.query;
  const csvPath = path.join(process.cwd(), "public", "data", "estim-pop-dep-2023.csv");
  const csv = fs.readFileSync(csvPath, "utf8");
  const { data } = Papa.parse(csv, { header: true, skipEmptyLines: true });

  const row = (data as any[]).find(row =>
    String(row["Départements_Code"] ?? "").trim() === String(dept_id)
  );

  if (!row) {
    res.status(404).json({ detail: "Département non trouvé" });
    return;
  }

  res.status(200).json(buildStructuredRow(row));
}
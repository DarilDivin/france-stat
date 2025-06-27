from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import os
import math

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def clean_number(x):
    if pd.isna(x) or (isinstance(x, float) and math.isnan(x)):
        return None
    return int(str(x).replace(" ", ""))

def build_structured_row(row, code_col, nom_col):
    return {
        "id": str(row[code_col]).strip(),
        "nom": str(row[nom_col]).strip() if nom_col in row else "",
        "ensemble": {
            "0_19": clean_number(row[("Ensemble", "0-19")]),
            "20_39": clean_number(row[("Ensemble", "20-39")]),
            "40_59": clean_number(row[("Ensemble", "40-59")]),
            "60_74": clean_number(row[("Ensemble", "60-74")]),
            "75_plus": clean_number(row[("Ensemble", "75+")]),
            "total": clean_number(row[("Ensemble", "Total")]),
        },
        "hommes": {
            "0_19": clean_number(row[("Hommes", "0-19")]),
            "20_39": clean_number(row[("Hommes", "20-39")]),
            "40_59": clean_number(row[("Hommes", "40-59")]),
            "60_74": clean_number(row[("Hommes", "60-74")]),
            "75_plus": clean_number(row[("Hommes", "75+")]),
            "total": clean_number(row[("Hommes", "Total")]),
        },
        "femmes": {
            "0_19": clean_number(row[("Femmes", "0-19")]),
            "20_39": clean_number(row[("Femmes", "20-39")]),
            "40_59": clean_number(row[("Femmes", "40-59")]),
            "60_74": clean_number(row[("Femmes", "60-74")]),
            "75_plus": clean_number(row[("Femmes", "75+")]),
            "total": clean_number(row[("Femmes", "Total")]),
        }
    }

@app.on_event("startup")
def load_data():
    csv_path = os.path.join(os.path.dirname(__file__), "../public/data/estim-pop-dep-2023.csv")
    df = pd.read_csv(csv_path, sep=";", header=[0, 1])

    # Correction des noms de colonnes pour chaque bloc
    columns = []
    current_group = None
    for a, b in df.columns:
        a = a.strip()
        b = b.strip()
        if a and not a.startswith("Unnamed"):
            current_group = a
        columns.append((current_group, b))
    df.columns = pd.MultiIndex.from_tuples(columns)

    # Renomme la colonne nom pour la rendre accessible simplement
    df = df.rename(columns={("Unnamed: 1_level_0", "Nom"): ("Départements", "Nom")})
    code_col = ("Départements", "Code")
    nom_col = ("Départements", "Nom")

    app.state.df = df
    app.state.code_col = code_col
    app.state.nom_col = nom_col

@app.get("/api/population")
def get_population():
    df = app.state.df
    code_col = app.state.code_col
    nom_col = app.state.nom_col
    result = []
    for _, row in df.iterrows():
        dept_id = str(row[code_col]).strip()
        if dept_id.isdigit() or dept_id in ["2A", "2B", "971", "972", "973", "974", "976"]:
            result.append(build_structured_row(row, code_col, nom_col))
    return result

@app.get("/api/population/{dept_id}")
def get_population_by_dept(dept_id: str):
    df = app.state.df
    code_col = app.state.code_col
    nom_col = app.state.nom_col
    for _, row in df.iterrows():
        if str(row[code_col]).strip() == dept_id:
            return build_structured_row(row, code_col, nom_col)
    raise HTTPException(status_code=404, detail="Département non trouvé")
import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import date
from pydantic import BaseModel
from typing import Optional
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from dotenv import load_dotenv

load_dotenv()

client_id = os.getenv("CLIENT_ID")

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
]

def get_google_sheet():
    try:
        # Load credentials from environment variable
        credentials_json = os.getenv("GOOGLE_CREDENTIALS_JSON")
        if not credentials_json:
            raise Exception("Missing GOOGLE_CREDENTIALS_JSON environment variable")

        creds_dict = json.loads(credentials_json)
        creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_dict, SCOPES)

        client = gspread.authorize(creds)
        return client.open_by_key(client_id).sheet1  # Replace with actual ID
    except Exception as e:
        print("🚨 Google Sheets auth failed:", str(e))
        raise e

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ✅ Allow React frontend
    allow_credentials=True,
    allow_methods=["*"],  # ✅ Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # ✅ Allow all headers
)

@app.get("/")
def read_root():
    return {"message": "Hello, FastAPI!"}


@app.get("/test_google_sheets")
async def test_google_sheets():
    try:
        sheet = get_google_sheet()
        return {"message": "Connexion réussie !", "titre_du_tableau": sheet.title}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Modèle pour les entrées financières
class FinanceEntry(BaseModel):
    date: date
    categorie: str
    type_transaction: str
    amount: float
    compte: str
    beneficiaire: str
    frequence: str
    details: Optional[str] = ""
    fuel_cost: Optional[float] = None

@app.post("/add_entry")
async def add_entry(entry: FinanceEntry):
    try:
        sheet = get_google_sheet()
        records = sheet.get_all_values()  # 📌 Récupère toutes les lignes sous forme de tableau

        if len(records) > 1:  # Vérifie s'il y a déjà des transactions (en excluant l'en-tête)
            last_id = int(records[-1][0])  # 📌 Prend l'ID de la dernière ligne
            new_id = last_id + 1  # 🔹 Incrémente l'ID
        else:
            new_id = 1  # 🔹 Si c'est la première transaction, commence à 1

        # Ajouter la ligne à Google Sheets
        sheet.append_row([
            new_id,  # 📌 Insère l'ID incrémental
            entry.date.strftime("%d-%b-%y"),
            entry.categorie,
            entry.type_transaction,
            entry.amount,
            entry.compte,
            entry.beneficiaire,
            entry.frequence,
            entry.details,
            entry.fuel_cost or ""
        ])

        return {"message": "Entrée ajoutée avec succès !", "id": new_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/get_entries")
async def get_entries():
    try:
        sheet = get_google_sheet()
        records = sheet.get_all_records()
        return JSONResponse(content=records)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get_dropdown_options")
async def get_dropdown_options():
    try:
        sheet = get_google_sheet()
        records = sheet.get_all_records()

        # Extraire les valeurs uniques pour chaque champ concerné
        categories = list(set(entry["categorie"] for entry in records if entry["categorie"]))
        types_frais = list(set(entry["type_transaction"] for entry in records if entry["type_transaction"]))
        comptes = list(set(entry["compte"] for entry in records if entry["compte"]))
        beneficiaires = list(set(entry["beneficiaire"] for entry in records if entry["beneficiaire"]))
        frequences = list(set(entry["frequence"] for entry in records if entry["frequence"]))

        return {
            "categories": categories,
            "types_frais": types_frais,
            "comptes": comptes,
            "beneficiaires": beneficiaires,
            "frequences": frequences
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

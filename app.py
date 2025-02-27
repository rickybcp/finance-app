import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import date
from pydantic import BaseModel
from typing import Optional
import gspread
from oauth2client.service_account import ServiceAccountCredentials

CREDENTIALS_PATH = os.getenv("C:/Users/ricky/OneDrive/My\ folders/Finances/secure_credentials", "credentials.json")

creds = ServiceAccountCredentials.from_json_keyfile_name(CREDENTIALS_PATH)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # ✅ Allow React frontend
    allow_credentials=True,
    allow_methods=["*"],  # ✅ Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # ✅ Allow all headers
)


# Configuration de l'API Google Sheets
SCOPES = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
CREDENTIALS_FILE = "credentials.json"  # Fichier JSON des credentials Google
SPREADSHEET_ID = "1qtK11Ko7wN6gii075ckKItmoNsF0i5PmlLm7CyW-Z4Y"  # Remplace par l'ID de ton Google Sheets

def get_google_sheet():
    creds = ServiceAccountCredentials.from_json_keyfile_name(CREDENTIALS_FILE, SCOPES)
    client = gspread.authorize(creds)
    return client.open_by_key(SPREADSHEET_ID).sheet1

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
    amount: str
    compte: str
    beneficiaire: str
    frequence: str
    details: str = ""
    fuel_cost: Optional[str] = None

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

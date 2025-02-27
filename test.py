import gspread
from oauth2client.service_account import ServiceAccountCredentials

SCOPES = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
CREDENTIALS_FILE = "credentials.json"
SPREADSHEET_ID = "1qtK11Ko7wN6gii075ckKItmoNsF0i5PmlLm7CyW-Z4Y"  # Replace with your actual Google Sheets ID

try:
    creds = ServiceAccountCredentials.from_json_keyfile_name(CREDENTIALS_FILE, SCOPES)
    client = gspread.authorize(creds)
    sheet = client.open_by_key(SPREADSHEET_ID).sheet1  # Open first sheet
    print("✅ Google Sheets Connection Successful!")
except Exception as e:
    print(f"❌ Error: {e}")

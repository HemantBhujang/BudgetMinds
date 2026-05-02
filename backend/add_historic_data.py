import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime

# Initialize the Admin SDK with your service account
try:
    if not firebase_admin._apps:
        cred = credentials.Certificate("budgetminds-7cbbc-firebase-adminsdk-fbsvc-179f18001b.json")
        firebase_admin.initialize_app(cred)
except Exception as e:
    print(f"Initialization error: {e}")

db = firestore.client()

# Default historical data records
historical_records = [
    {
        "eventName": "Company Retreat 2023",
        "eventDate": "2023",
        "totalBudgetINR": 150000,
        "businessOutcome": "Highly successful team building, improved morale.",
        "timestamp": firestore.SERVER_TIMESTAMP
    },
    {
        "eventName": "Annual Client Networking",
        "eventDate": "2023",
        "totalBudgetINR": 275000,
        "businessOutcome": "Secured 3 major enterprise contracts.",
        "timestamp": firestore.SERVER_TIMESTAMP
    },
    {
        "eventName": "Q1 Strategic Offsite",
        "eventDate": "2024",
        "totalBudgetINR": 85000,
        "businessOutcome": "Finalized Q2-Q4 product roadmap.",
        "timestamp": firestore.SERVER_TIMESTAMP
    }
]

print("Uploading historic data to Firestore...")

try:
    for record in historical_records:
        db.collection('historical_events').add(record)
        print(f"Successfully added: {record['eventName']}")
    print("\nAll historical data uploaded successfully!")
except Exception as e:
    print(f"\nFailed to upload data. Is your Firestore Database created in the Firebase Console? Error: {e}")

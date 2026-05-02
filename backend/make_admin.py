import firebase_admin
from firebase_admin import credentials, auth, firestore
import os

# Initialize Firebase Admin
cred = credentials.Certificate("budgetminds-7cbbc-firebase-adminsdk-fbsvc-179f18001b.json")
firebase_admin.initialize_app(cred)

def upgrade_admin(email: str):
    print(f"Upgrading {email} to Admin...")
    
    # 1. Get user by email from Firebase Auth
    try:
        user = auth.get_user_by_email(email)
        uid = user.uid
        print(f"Found user UID: {uid}")
    except Exception as e:
        print(f"Error fetching user from Auth: {e}")
        return

    # 2. Set custom claims { "admin": True, "role": "Admin" }
    try:
        auth.set_custom_user_claims(uid, {"admin": True, "role": "Admin"})
        print(f"Custom claims updated for UID {uid}")
    except Exception as e:
        print(f"Error setting custom claims: {e}")
        return

    # 3. Create or update document in Firestore
    try:
        db = firestore.client()
        user_ref = db.collection("users").document(uid)
        user_ref.set({
            "email": email,
            "role": "Admin",
            "name": "Super Admin",
            # We don't have the backend SQLite ID here, but the frontend might not crash if we omit it
            # since Admin doesn't need to be assigned as a coordinator to events
        }, merge=True)
        print(f"Firestore document updated at users/{uid}")
    except Exception as e:
        print(f"Error updating Firestore: {e}")
        return
        
    print(f"Successfully upgraded {email} to Admin!")

if __name__ == "__main__":
    upgrade_admin("admin@budgetminds.com")

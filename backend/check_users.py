import os
import sys
import firebase_admin
from firebase_admin import credentials, firestore

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.core.config import settings

def main():
    cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_PATH)
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    
    users = db.collection("users").stream()
    for user in users:
        print(f"{user.id} => {user.to_dict()}")

if __name__ == "__main__":
    main()

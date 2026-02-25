import os
import firebase_admin
from firebase_admin import credentials, firestore
from app.core.config import settings

def initialize_firebase():
    """
    Initializes Firebase Admin SDK.
    Requires firebase-service-account.json in the backend directory.
    """
    if not firebase_admin._apps:
        # Check if the service account file exists
        if os.path.exists(settings.FIREBASE_SERVICE_ACCOUNT_PATH):
            cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_PATH)
            firebase_admin.initialize_app(cred)
            print("Firebase Admin SDK initialized successfully.")
        else:
            print(f"WARNING: Firebase service account file not found at {settings.FIREBASE_SERVICE_ACCOUNT_PATH}. "
                  "Firebase functionality will be disabled.")
            return None
    
    return firestore.client()

db = initialize_firebase()

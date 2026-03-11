import os
import firebase_admin
from firebase_admin import credentials, firestore, auth
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
            # Fallback to default credentials (useful for GCP environments)
            try:
                firebase_admin.initialize_app()
                print("Firebase Admin SDK initialized with default credentials.")
            except Exception as e:
                print(f"CRITICAL: Firebase service account file not found and default credentials failed: {e}")
                return None, None
    
    return firestore.client(), auth

# Initialize and export
db, firebase_auth = initialize_firebase()

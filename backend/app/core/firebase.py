import os
import firebase_admin
from firebase_admin import credentials, firestore, auth
from app.core.config import settings

def initialize_firebase():
    """
    Initializes Firebase Admin SDK using environment variables.
    """
    if not firebase_admin._apps:
        # Construct service account info from settings
        try:
            # Handle the private key newline characters if they are escaped in .env
            private_key = settings.FIREBASE_PRIVATE_KEY.replace('\\n', '\n')
            
            cred_dict = {
                "type": settings.FIREBASE_TYPE,
                "project_id": settings.FIREBASE_PROJECT_ID,
                "private_key_id": settings.FIREBASE_PRIVATE_KEY_ID,
                "private_key": private_key,
                "client_email": settings.FIREBASE_CLIENT_EMAIL,
                "client_id": settings.FIREBASE_CLIENT_ID,
                "auth_uri": settings.FIREBASE_AUTH_URI,
                "token_uri": settings.FIREBASE_TOKEN_URI,
                "auth_provider_x509_cert_url": settings.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
                "client_x509_cert_url": settings.FIREBASE_CLIENT_X509_CERT_URL,
                "universe_domain": settings.FIREBASE_UNIVERSE_DOMAIN
            }
            
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            print("Firebase Admin SDK initialized successfully from environment variables.")
        except Exception as e:
            print(f"ERROR: Failed to initialize Firebase with environment variables: {e}")
            # Fallback to default credentials (useful for GCP environments)
            try:
                firebase_admin.initialize_app()
                print("Firebase Admin SDK initialized with default credentials.")
            except Exception as e2:
                print(f"CRITICAL: Firebase initialization failed: {e2}")
                return None, None
    
    return firestore.client(), auth

# Initialize and export
db, firebase_auth = initialize_firebase()

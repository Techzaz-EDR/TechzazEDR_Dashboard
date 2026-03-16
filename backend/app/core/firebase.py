import firebase_admin
from firebase_admin import credentials, firestore, auth
from app.core.config import settings


def initialize_firebase():
    """
    Initializes Firebase Admin SDK using credentials from environment variables.
    """
    if not firebase_admin._apps:
        service_account_info = {
            "type": settings.FIREBASE_TYPE,
            "project_id": settings.FIREBASE_PROJECT_ID,
            "private_key_id": settings.FIREBASE_PRIVATE_KEY_ID,
            "private_key": settings.FIREBASE_PRIVATE_KEY.replace("\\n", "\n"),
            "client_email": settings.FIREBASE_CLIENT_EMAIL,
            "client_id": settings.FIREBASE_CLIENT_ID,
            "auth_uri": settings.FIREBASE_AUTH_URI,
            "token_uri": settings.FIREBASE_TOKEN_URI,
            "auth_provider_x509_cert_url": settings.FIREBASE_AUTH_PROVIDER_CERT_URL,
            "client_x509_cert_url": settings.FIREBASE_CLIENT_CERT_URL,
            "universe_domain": settings.FIREBASE_UNIVERSE_DOMAIN,
        }

        try:
            cred = credentials.Certificate(service_account_info)
            firebase_admin.initialize_app(cred)
            print("Firebase Admin SDK initialized successfully from environment variables.")
        except Exception as e:
            print(f"CRITICAL: Failed to initialize Firebase Admin SDK: {e}")
            return None, None

    return firestore.client(), auth


# Initialize and export
db, firebase_auth = initialize_firebase()

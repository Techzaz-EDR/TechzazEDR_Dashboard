import os
import firebase_admin
from firebase_admin import credentials, firestore, auth
from dotenv import load_dotenv

def get_firebase_credentials():
    """
    Constructs Firebase credentials from environment variables.
    """
    # Load .env from current directory or parent directory
    if os.path.exists(".env"):
        load_dotenv(".env")
    elif os.path.exists("../.env"):
        load_dotenv("../.env")
    else:
        load_dotenv() # Fallback to default search
    
    
    private_key = os.getenv("FIREBASE_PRIVATE_KEY", "")
    if "\\n" in private_key:
        private_key = private_key.replace('\\n', '\n')
    
    # Remove surrounding quotes if they were somehow preserved
    if private_key.startswith('"') and private_key.endswith('"'):
        private_key = private_key[1:-1]
    if private_key.startswith("'") and private_key.endswith("'"):
        private_key = private_key[1:-1]
        
    cred_dict = {
        "type": os.getenv("FIREBASE_TYPE", "service_account"),
        "project_id": os.getenv("FIREBASE_PROJECT_ID"),
        "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
        "private_key": private_key,
        "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
        "client_id": os.getenv("FIREBASE_CLIENT_ID"),
        "auth_uri": os.getenv("FIREBASE_AUTH_URI", "https://accounts.google.com/o/oauth2/auth"),
        "token_uri": os.getenv("FIREBASE_TOKEN_URI", "https://oauth2.googleapis.com/token"),
        "auth_provider_x509_cert_url": os.getenv("FIREBASE_AUTH_PROVIDER_X509_CERT_URL", "https://www.googleapis.com/oauth2/v1/certs"),
        "client_x509_cert_url": os.getenv("FIREBASE_CLIENT_X509_CERT_URL"),
        "universe_domain": os.getenv("FIREBASE_UNIVERSE_DOMAIN", "googleapis.com")
    }
    
    # If environment variables are missing, return None (do not fallback to JSON)
    if not cred_dict["project_id"] or not cred_dict["private_key"]:
        return None
    return credentials.Certificate(cred_dict)

def init_firebase():
    """
    Initializes Firebase and returns db and auth.
    """
    if not firebase_admin._apps:
        cred = get_firebase_credentials()
        if cred:
            firebase_admin.initialize_app(cred)
        else:
            # Fallback to default credentials
            try:
                firebase_admin.initialize_app()
            except Exception as e:
                print(f"Failed to initialize Firebase: {e}")
                return None, None
                
    return firestore.client(), auth

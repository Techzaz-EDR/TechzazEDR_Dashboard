import os
import firebase_admin
from firebase_admin import credentials, auth

SERVICE_ACCOUNT_PATH = "firebase-service-account.json"
ADMIN_EMAIL = "INUKA.20240695@iit.ac.lk"

def check_user():
    if not os.path.exists(SERVICE_ACCOUNT_PATH):
        print(f"Error: Service account not found at {SERVICE_ACCOUNT_PATH}")
        return

    try:
        cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
        firebase_admin.initialize_app(cred)
        
        try:
            user = auth.get_user_by_email(ADMIN_EMAIL)
            print(f"User Found (as-is): {user.email}")
        except auth.UserNotFoundError:
            user = auth.get_user_by_email(ADMIN_EMAIL.lower())
            print(f"User Found (lowercase): {user.email}")

        print(f"UID: {user.uid}")
        print(f"Email Verified: {user.email_verified}")
        print(f"Custom Claims: {user.custom_claims}")
        print(f"Disabled: {user.disabled}")
        
    except auth.UserNotFoundError:
        print(f"Error: User {ADMIN_EMAIL} not found in Firebase Auth.")
    except Exception as e:
        print(f"Error checking user: {e}")

if __name__ == "__main__":
    check_user()

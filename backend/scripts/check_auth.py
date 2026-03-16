import firebase_admin
from firebase_init import init_firebase

ADMIN_EMAIL = "INUKA.20240695@iit.ac.lk"

def check_user():
    db, auth = init_firebase()
    if not auth:
        print("Could not initialize Firebase Auth")
        return

    try:
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

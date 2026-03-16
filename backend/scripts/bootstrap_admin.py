import os
import firebase_admin
from firebase_admin import credentials, auth, firestore
from datetime import datetime, UTC
from firebase_init import init_firebase

# Configuration
ADMIN_EMAIL = "inuka.20240695@iit.ac.lk"
TENANT_NAME = "orgtest1"

def bootstrap():
    db, auth_client = init_firebase()
    if not db:
        print("Could not initialize Firebase")
        return

    print(f"--- Bootstrapping Admin: {ADMIN_EMAIL} ---")

    try:
        # 1. Create or get Tenant
        # For simplicity, we create a new one. In a real app, you might check for existing.
        tenant_ref = db.collection("tenants").document()
        tenant_id = tenant_ref.id
        tenant_ref.set({
            "name": TENANT_NAME,
            "createdAt": datetime.now(UTC),
            "status": "active"
        })
        print(f"Created Tenant: {TENANT_NAME} (ID: {tenant_id})")

        # 2. Create User in Firebase Auth
        try:
            user_record = auth_client.get_user_by_email(ADMIN_EMAIL)
            print(f"User {ADMIN_EMAIL} already exists in Auth. Updating claims...")
        except auth_client.UserNotFoundError:
            # Set a temporary password - they should reset it later
            user_record = auth_client.create_user(
                email=ADMIN_EMAIL,
                email_verified=True,
                password="ChangeMe123!", 
                display_name="Inuka Admin"
            )
            print(f"Created new Auth user for {ADMIN_EMAIL}")

        # 3. Set Custom Claims
        auth_client.set_custom_user_claims(user_record.uid, {
            "tenantId": tenant_id,
            "role": "Admin"
        })
        print(f"Set Custom Claims: tenantId={tenant_id}, role=Admin")

        # 4. Create/Update User in Firestore
        user_doc = {
            "uid": user_record.uid,
            "email": ADMIN_EMAIL,
            "tenantId": tenant_id,
            "role": "Admin",
            "status": "active",
            "createdAt": datetime.now(UTC)
        }
        db.collection("users").document(user_record.uid).set(user_doc)
        print(f"Created/Updated Firestore user document.")

        print("\n--- DONE ---")
        print(f"User UID: {user_record.uid}")
        if user_record.email_verified:
            print("Login with email and your chosen password.")
        else:
            link = auth_client.generate_password_reset_link(ADMIN_EMAIL)
            print(f"Password Reset/Setup Link: {link}")

    except Exception as e:
        print(f"Error during bootstrap: {e}")

if __name__ == "__main__":
    bootstrap()

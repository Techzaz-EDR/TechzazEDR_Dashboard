import os
import firebase_admin
from firebase_admin import credentials, firestore, auth

SERVICE_ACCOUNT_PATH = "firebase-service-account.json"
USER_EMAIL = "inuka.20240695@iit.ac.lk"
NEW_ORG_NAME = "orgtest1"

def update_org():
    if not os.path.exists(SERVICE_ACCOUNT_PATH):
        print(f"Error: Service account not found at {SERVICE_ACCOUNT_PATH}")
        return

    cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
    firebase_admin.initialize_app(cred)
    db = firestore.client()

    print(f"--- Updating Organization for: {USER_EMAIL} ---")

    try:
        # 1. Find the user to get their tenantId
        user_record = auth.get_user_by_email(USER_EMAIL)
        uid = user_record.uid
        
        user_doc = db.collection("users").document(uid).get()
        if not user_doc.exists:
            print(f"Error: User document for {uid} not found in Firestore.")
            return
            
        tenant_id = user_doc.to_dict().get("tenantId")
        if not tenant_id:
            print(f"Error: No tenantId found for user {USER_EMAIL}")
            return
            
        # 2. Update the tenant name
        db.collection("tenants").document(tenant_id).update({
            "name": NEW_ORG_NAME
        })
        print(f"Updated Tenant {tenant_id} name to: {NEW_ORG_NAME}")
        
        print("\n--- DONE ---")

    except Exception as e:
        print(f"Error during organization update: {e}")

if __name__ == "__main__":
    update_org()

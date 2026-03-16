import os
import firebase_admin
from firebase_admin import credentials, firestore, auth
from firebase_init import init_firebase

USER_EMAIL = "inuka.20240695@iit.ac.lk"
NEW_ORG_NAME = "orgtest1"

def update_org():
    db, auth_client = init_firebase()
    if not db:
        print("Could not initialize Firebase")
        return

    print(f"--- Updating Organization for: {USER_EMAIL} ---")

    try:
        # 1. Find the user to get their tenantId
        user_record = auth_client.get_user_by_email(USER_EMAIL)
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

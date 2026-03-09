import os
import sys
import firebase_admin
from firebase_admin import credentials, firestore, auth
from datetime import datetime, UTC

# Add the backend directory to python path if not running from there
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings

def sync_users_to_demo_org():
    print("Starting synchronization of Firebase Auth users to Firestore under 'demo-org'...")
    
    # Initialize Firebase if not already initialized
    if not firebase_admin._apps:
        if os.path.exists(settings.FIREBASE_SERVICE_ACCOUNT_PATH):
            cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_PATH)
            firebase_admin.initialize_app(cred)
            print("Firebase Admin SDK initialized successfully.")
        else:
            print(f"CRITICAL: Firebase service account file not found at {settings.FIREBASE_SERVICE_ACCOUNT_PATH}")
            return

    db = firestore.client()
    
    # Target Configuration
    TARGET_TENANT = "demo-org"
    TARGET_ROLE = "Admin"
    
    try:
        # Fetch all existing users from Firebase Authentication (handles up to 1000 users per page by default)
        page = auth.list_users()
        users = page.users
        while page.has_next_page:
            page = page.get_next_page()
            users.extend(page.users)
            
        print(f"Found {len(users)} users in Firebase Authentication.")
        
        updated_count = 0
        for user in users:
            uid = user.uid
            email = user.email
            
            print(f"Processing user: {email} ({uid})")
            
            # 1. Update Custom User Claims in Auth
            try:
                # Merge with existing claims if any exist to avoid overwriting unrelated claims,
                # though usually it's fine to just overwrite.
                current_claims = user.custom_claims or {}
                current_claims["tenantId"] = TARGET_TENANT
                current_claims["role"] = TARGET_ROLE
                
                auth.set_custom_user_claims(uid, current_claims)
            except Exception as e:
                print(f"  [ERROR] Failed to set custom claims for {email}: {e}")
                continue
                
            # 2. Upsert Document in Firestore root 'users' collection
            try:
                user_doc = {
                    "uid": uid,
                    "email": email,
                    "tenantId": TARGET_TENANT,
                    "role": TARGET_ROLE,
                    "status": "active",
                    # Using current time as a fallback if user creation time isn't explicitly available, 
                    # but we can try to use user.user_metadata.creation_timestamp
                    "createdAt": datetime.now(UTC),
                    "createdBy": "system_sync_script"
                }
                
                # If the user has a creation timestamp, use it
                if user.user_metadata and hasattr(user.user_metadata, 'creation_timestamp') and user.user_metadata.creation_timestamp:
                    try:
                        # Convert JS timestamp (ms) to Python datetime
                        creation_dt = datetime.fromtimestamp(user.user_metadata.creation_timestamp / 1000.0, tz=UTC)
                        user_doc["createdAt"] = creation_dt
                    except Exception:
                        pass
                
                db.collection("users").document(uid).set(user_doc, merge=True)
                updated_count += 1
                print(f"  [SUCCESS] Synced Custom Claims and Firestore Document.")
            except Exception as e:
                print(f"  [ERROR] Failed to write Firestore document for {email}: {e}")
                continue
                
        print(f"\nMigration Complete! Successfully synchronized {updated_count}/{len(users)} users to {TARGET_TENANT}.")
        
    except Exception as e:
        print(f"CRITICAL ERROR during migration: {e}")

if __name__ == "__main__":
    sync_users_to_demo_org()

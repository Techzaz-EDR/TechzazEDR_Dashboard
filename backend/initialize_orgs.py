import os
import sys
import firebase_admin
from firebase_admin import credentials, firestore

# Add the backend directory to python path if not running from there
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings

def main():
    print("Initializing Database Structure for Multi-Tenant EDR...")

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

    orgs_list = [
        {
            "id": "techzaz-llc",
            "name": "TechZaz LLC",
            "tier": "Enterprise",
            "agents": ["DESKTOP-JH1UZAE"]
        },
        {
            "id": "acme-corp",
            "name": "Acme Corporation",
            "tier": "Pro",
            "agents": ["LAPTOP-HQ123", "SERVER-01"]
        },
        {
            "id": "demo-org",
            "name": "Demo Organization",
            "tier": "Free",
            "agents": ["DESKTOP-TEST1"]
        }
    ]

    for org in orgs_list:
        org_id = org["id"]
        print(f"Creating root document for organization: {org_id}...")
        
        # 1. Create Organization Document
        org_ref = db.collection("organizations").document(org_id)
        org_ref.set({
            "name": org["name"],
            "tier": org["tier"],
            "created_at": firestore.SERVER_TIMESTAMP
        })
        
        # 2. Create Dummy Agents for that Organization
        for agent_id in org["agents"]:
            agent_ref = org_ref.collection("agents").document(agent_id)
            agent_ref.set({
                "hostname": agent_id,
                "ip": "192.168.1.101" if agent_id == "DESKTOP-TEST1" else "192.168.1.x",
                "os": "Windows 10 Pro" if agent_id == "DESKTOP-TEST1" else "Windows 11",
                "status": "offline",
                "last_seen": firestore.SERVER_TIMESTAMP
            })
            print(f"  -> Created agent placeholder: {agent_id}")

    print("\nDatabase initialization complete! You can now view the hierarchy in Firebase Console.")

if __name__ == "__main__":
    main()

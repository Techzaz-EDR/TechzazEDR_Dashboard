import os
import sys
import firebase_admin
from firebase_admin import credentials, firestore
from firebase_init import init_firebase

def main():
    print("Initializing Database Structure for Multi-Tenant EDR...")

    db, _ = init_firebase()
    if not db:
        print("Could not initialize Firebase")
        return

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

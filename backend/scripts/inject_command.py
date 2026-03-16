import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, UTC
from firebase_init import init_firebase

def inject_command():
    db, _ = init_firebase()
    if not db:
        print("Could not initialize Firebase")
        return

    agent_id = "DESKTOP-TEST1"
    commands_ref = db.collection("organizations").document("demo-org").collection("agents").document(agent_id).collection("commands")
    
    new_cmd = {
        "command": "run_hids_scan",
        "parameters": {},
        "status": "pending",
        "timestamp": datetime.now(UTC),
        "created_by": "verification_script"
    }
    
    _, doc_ref = commands_ref.add(new_cmd)
    print(f"Command injected: {doc_ref.id}")

if __name__ == "__main__":
    inject_command()

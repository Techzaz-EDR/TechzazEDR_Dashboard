import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
import os

def inject_command():
    cred_path = "../../firebase-service-account.json"
    if not os.path.exists(cred_path):
        cred_path = "firebase-service-account.json"

    if not firebase_admin._apps:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)

    db = firestore.client()
    agent_id = "DESKTOP-TEST1"
    commands_ref = db.collection("organizations").document("demo-org").collection("agents").document(agent_id).collection("commands")
    
    new_cmd = {
        "command": "run_hids_scan",
        "parameters": {},
        "status": "pending",
        "timestamp": datetime.utcnow(),
        "created_by": "verification_script"
    }
    
    _, doc_ref = commands_ref.add(new_cmd)
    print(f"Command injected: {doc_ref.id}")

if __name__ == "__main__":
    inject_command()

import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, UTC
import uuid
from firebase_init import init_firebase

def add_test_alert(agent_id, org_id="demo-org"):
    db, _ = init_firebase()
    if not db:
        print("Could not initialize Firebase")
        return

    alert_id = str(uuid.uuid4())
    alert_data = {
        "timestamp": datetime.now(UTC), # Use actual datetime for Firestore timestamp
        "organization_id": org_id,
        "RuleId": "AGGREGATION_TEST",
        "Category": "Security Audit",
        "Severity": "High",
        "Status": "new",
        "Details": {
            "description": f"Aggregated alert from {agent_id} - " + datetime.now().strftime("%H:%M:%S"),
            "file_path": "C:\\Windows\\System32\\cmd.exe"
        }
    }
    
    alert_ref = db.collection("organizations").document(org_id).collection("agents").document(agent_id).collection("alerts").document(alert_id)
    alert_ref.set(alert_data)
    print(f"Added test alert {alert_id} for {agent_id} with timestamp {alert_data['timestamp']}")

if __name__ == "__main__":
    add_test_alert("DESKTOP-TEST1")

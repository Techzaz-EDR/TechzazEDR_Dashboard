import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
import uuid

# Set path to service account
cert_path = "d:/Documents/GitHub/TechzazEDR_Dashboard/backend/firebase-service-account.json"
cred = credentials.Certificate(cert_path)
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()

def add_test_alert(agent_id, org_id="demo-org"):
    alert_id = str(uuid.uuid4())
    alert_data = {
        "Timestamp": datetime.utcnow().isoformat(),
        "RuleId": "TEST_ALERT_SYNC_WORKS",
        "Category": "Malware Detection",
        "Severity": "Critical",
        "Status": "new",
        "Details": {
            "description": "DIRECT INJECTION TEST - " + datetime.now().strftime("%H:%M:%S"),
            "file_path": "C:\\Windows\\Temp\\test.exe"
        }
    }
    
    alert_ref = db.collection("organizations").document(org_id).collection("agents").document(agent_id).collection("alerts").document(alert_id)
    alert_ref.set(alert_data)
    print(f"Added test alert {alert_id} for {agent_id} with timestamp {alert_data['Timestamp']}")

if __name__ == "__main__":
    add_test_alert("DESKTOP-TEST1")

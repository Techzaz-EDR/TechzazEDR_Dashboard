import firebase_admin
from firebase_admin import credentials, firestore
import json
import os

# Set path to service account
cert_path = "d:/Documents/GitHub/TechzazEDR_Dashboard/backend/firebase-service-account.json"
cred = credentials.Certificate(cert_path)
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()

def list_alerts(agent_id, org_id="demo-org"):
    alerts_ref = db.collection("organizations").document(org_id).collection("agents").document(agent_id).collection("alerts")
    # Order by Timestamp descending
    results = alerts_ref.order_by("Timestamp", direction=firestore.Query.DESCENDING).limit(10).stream()
    
    print(f"Latest 10 alerts for {agent_id}:")
    count = 0
    for doc in results:
        count += 1
        data = doc.to_dict()
        print(f"ID: {doc.id} | Timestamp: {data.get('Timestamp')} | RuleId: {data.get('RuleId')} | Category: {data.get('Category')}")
    
    if count == 0:
        print("No alerts found.")

if __name__ == "__main__":
    list_alerts("DESKTOP-TEST1")

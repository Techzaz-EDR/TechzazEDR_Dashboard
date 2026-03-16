import firebase_admin
from firebase_admin import credentials, firestore
import json
import os
from firebase_init import init_firebase

def list_alerts(agent_id, org_id="demo-org"):
    db, _ = init_firebase()
    if not db:
        print("Could not initialize Firebase")
        return

    alerts_ref = db.collection("organizations").document(org_id).collection("agents").document(agent_id).collection("alerts")
    # Order by Timestamp or timestamp (handling both if needed, but following original script)
    try:
        results = alerts_ref.order_by("Timestamp", direction=firestore.Query.DESCENDING).limit(10).stream()
    except:
        results = alerts_ref.order_by("timestamp", direction=firestore.Query.DESCENDING).limit(10).stream()
    
    print(f"Latest 10 alerts for {agent_id}:")
    count = 0
    for doc in results:
        count += 1
        data = doc.to_dict()
        print(f"ID: {doc.id} | Timestamp: {data.get('Timestamp') or data.get('timestamp')} | RuleId: {data.get('RuleId')} | Category: {data.get('Category')}")
    
    if count == 0:
        print("No alerts found.")

if __name__ == "__main__":
    list_alerts("DESKTOP-TEST1")

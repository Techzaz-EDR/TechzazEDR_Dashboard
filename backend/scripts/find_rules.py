import firebase_admin
from firebase_admin import firestore
import os
import sys

# Add the parent directory to sys.path so we can import firebase_init
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from firebase_init import init_firebase

def list_rules():
    db, _ = init_firebase()
    if not db:
        print("Could not initialize Firebase")
        return

    print("--- Rules Collection ---")
    rules = db.collection("rules").stream()
    for rule in rules:
        print(f"Rule ID: {rule.id}")

    print("\n--- Unique Rule IDs in Alerts ---")
    unique_ids = set()
    alerts = db.collection_group("alerts").stream()
    for alert in alerts:
        data = alert.to_dict()
        rule_id = data.get("RuleId")
        if rule_id:
            unique_ids.add(rule_id)
    
    for rid in sorted(list(unique_ids)):
        print(f"Alert Rule ID: {rid}")

if __name__ == "__main__":
    list_rules()

import firebase_admin
from firebase_admin import firestore
import os
import sys

# Add the parent directory to sys.path so we can import firebase_init
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from firebase_init import init_firebase

def migrate():
    print("--- Starting NET-TCP-FLAG to NET-10 Migration ---")
    db, _ = init_firebase()
    if not db:
        print("Failed to initialize Firebase")
        return

    # 1. Migrate Rule Definition
    print("Checking rules collection...")
    old_rule_ref = db.collection("rules").document("NET-TCP-FLAG")
    new_rule_ref = db.collection("rules").document("NET-10")

    doc = old_rule_ref.get()
    if doc.exists:
        data = doc.to_dict()
        # Also update the 'name' internal to the doc if it matches
        if data.get("name") == "NET-TCP-FLAG":
            data["name"] = "NET-10"
            
        new_rule_ref.set(data)
        old_rule_ref.delete()
        print("[v] Migrated rules/NET-TCP-FLAG to rules/NET-10")
    else:
        print("[!] rules/NET-TCP-FLAG not found, skipping rule definition migration")

    # 2. Migrate Alerts (Collection Group)
    print("Searching for alerts with RuleId == 'NET-TCP-FLAG' in collection group...")
    try:
        alerts_query = db.collection_group("alerts").where("RuleId", "==", "NET-TCP-FLAG").stream()
        
        count = 0
        for alert_doc in alerts_query:
            alert_doc.reference.update({"RuleId": "NET-10"})
            count += 1
        
        print(f"[v] Updated {count} existing alerts (RuleId: NET-TCP-FLAG -> NET-10)")
    except Exception as e:
        print(f"[X] Error updating alerts: {e}")

    print("--- Migration Complete ---")

if __name__ == "__main__":
    migrate()

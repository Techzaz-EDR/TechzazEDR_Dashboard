import httpx
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
import os
import time
from firebase_init import init_firebase

def verify():
    print("Starting verification...")
    
    db, _ = init_firebase()
    if not db:
        print("Could not initialize Firebase")
        return

    agent_id = "DESKTOP-TEST1"
    organization_id = "demo-org"
    agent_ref = db.collection("organizations").document(organization_id).collection("agents").document(agent_id)
    
    print(f"Checking agent {agent_id} in {organization_id}...")
    doc = agent_ref.get()
    if not doc.exists:
        print(f"Agent {agent_id} does not exist. Creating a placeholder...")
        agent_ref.set({"status": "offline", "last_seen": "never"})
        doc = agent_ref.get()
        
    old_last_seen = doc.to_dict().get("last_seen")
    print(f"Old last_seen: {old_last_seen}")

    # 2. Call the /poll endpoint
    url = "http://127.0.0.1:8000/api/v1/commands/poll"
    params = {"agent_id": agent_id}
    headers = {"x-api-key": "tz_demo_d3m00rgk3y"}
    
    print(f"Calling API at {url}...")
    try:
        # Use a timeout of 10 seconds
        response = httpx.get(url, params=params, headers=headers, timeout=10.0)
        print(f"Response Status: {response.status_code}")
        print(f"Response Body: {response.text}")
    except httpx.ConnectError:
        print("Error: Could not connect to the backend server. Is it running?")
        return
    except Exception as e:
        print(f"Error calling API: {type(e).__name__}: {e}")
        return

    # 3. Wait a bit for Firestore update
    print("Waiting for Firestore update...")
    time.sleep(2)

    # 4. Check new last_seen in Firestore
    print("Re-checking Firestore...")
    doc = agent_ref.get()
    new_last_seen = doc.to_dict().get("last_seen")
    print(f"New last_seen: {new_last_seen}")

    if new_last_seen and new_last_seen != old_last_seen:
        print("SUCCESS: last_seen was updated!")
    else:
        print(f"FAILURE: last_seen was NOT updated. Old: {old_last_seen}, New: {new_last_seen}")

if __name__ == "__main__":
    verify()

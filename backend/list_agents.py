import firebase_admin
from firebase_admin import credentials, firestore
import json
import os

def list_agents():
    cred_path = "../../firebase-service-account.json"
    if not os.path.exists(cred_path):
        print("Service account file not found")
        return

    if not firebase_admin._apps:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)

    db = firestore.client()
    agents_ref = db.collection("organizations").document("demo-org").collection("agents")
    docs = agents_ref.stream()

    print("Registered Agents in demo-org:")
    for doc in docs:
        print(f"- {doc.id}: {doc.to_dict().get('status', 'unknown')}")

if __name__ == "__main__":
    list_agents()

import firebase_admin
from firebase_admin import credentials, firestore
from firebase_init import init_firebase

def list_agents():
    db, _ = init_firebase()
    if not db:
        print("Could not initialize Firebase")
        return

    agents_ref = db.collection("organizations").document("demo-org").collection("agents")
    docs = agents_ref.stream()

    print("Registered Agents in demo-org:")
    for doc in docs:
        print(f"- {doc.id}: {doc.to_dict().get('status', 'unknown')}")

if __name__ == "__main__":
    list_agents()

import os
import sys
import firebase_admin
from firebase_admin import credentials, firestore
from firebase_init import init_firebase

def main():
    db, _ = init_firebase()
    if not db:
        print("Could not initialize Firebase")
        return
    
    users = db.collection("users").stream()
    for user in users:
        print(f"{user.id} => {user.to_dict()}")

if __name__ == "__main__":
    main()

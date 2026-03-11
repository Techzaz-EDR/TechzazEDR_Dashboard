from fastapi import APIRouter, HTTPException
from firebase_admin import firestore
from app.core.firebase import db

router = APIRouter()

@router.get("/test-firebase")
async def test_firebase():
    if db is None:
        raise HTTPException(status_code=500, detail="Firebase not initialized. Check service account JSON.")
    
    try:
        # Write a dummy document
        doc_ref = db.collection("test_connection").document("status")
        doc_ref.set({
            "connected": True,
            "message": "Firebase is working!",
            "timestamp": firestore.SERVER_TIMESTAMP
        })
        
        # Read it back
        doc = doc_ref.get()
        return {"status": "success", "data": doc.to_dict()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, UTC
import uuid
import secrets
from firebase_admin import auth
from app.core.firebase import db
from app.core.auth import security, UserContext

router = APIRouter()

class RegisterRequest(BaseModel):
    firstName: str
    lastName: str
    companyName: str
    phone: str
    country: str

@router.post("/register", response_model=dict)
async def register_organization(
    req: RegisterRequest,
    token: str = Depends(security)
):
    """
    Initializes a new organization and user profile after the user has 
    already created their Firebase Auth account on the frontend.
    """
    try:
        # 1. Verify the ID token (manual verification because claims aren't set yet)
        decoded_token = auth.verify_id_token(token.credentials)
        uid = decoded_token['uid']
        email = decoded_token.get('email')

        if not email:
            raise HTTPException(status_code=400, detail="Email is required in the authentication token.")

        # 2. Check if user already has an organization (safety check)
        user_ref = db.collection("users").document(uid)
        if user_ref.get().exists:
            raise HTTPException(status_code=400, detail="User is already registered with an organization.")

        # 3. Generate Tenant ID and API Key
        # We use a mix of company name and random string for the tenant ID
        clean_name = "".join(filter(str.isalnum, req.companyName.lower()))[:10]
        tenant_id = f"{clean_name}_{secrets.token_hex(4)}"
        api_key = f"tz_{secrets.token_hex(16)}"

        # 4. Create Organization Record
        org_doc = {
            "id": tenant_id,
            "name": req.companyName,
            "country": req.country,
            "phone": req.phone,
            "owner_uid": uid,
            "api_key": api_key,
            "status": "active",
            "createdAt": datetime.now(UTC)
        }
        db.collection("organizations").document(tenant_id).set(org_doc)

        # 5. Create User Record in Firestore
        user_doc = {
            "uid": uid,
            "email": email,
            "firstName": req.firstName,
            "lastName": req.lastName,
            "name": f"{req.firstName} {req.lastName}",
            "tenantId": tenant_id,
            "role": "Admin",
            "status": "active",
            "companyName": req.companyName,
            "phone": req.phone,
            "createdAt": datetime.now(UTC),
            "last_seen": datetime.now(UTC)
        }
        db.collection("users").document(uid).set(user_doc)

        # 6. Set Custom Claims on Firebase Auth
        auth.set_custom_user_claims(uid, {
            "tenantId": tenant_id,
            "role": "Admin"
        })

        return {
            "status": "success",
            "message": "Organization and user profile initialized successfully.",
            "tenantId": tenant_id,
            "role": "Admin"
        }

    except auth.ExpiredIdTokenError:
        raise HTTPException(status_code=401, detail="Authentication token expired.")
    except Exception as e:
        print(f"Registration Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to initialize organization: {str(e)}")

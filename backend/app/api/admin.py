from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime, UTC
from firebase_admin import auth
from app.core.firebase import db, firebase_auth
from app.core.auth import UserContext, RoleChecker
from app.core.audit import log_audit_event

router = APIRouter()

# Schema for creating/inviting a user
class UserInviteRequest(BaseModel):
    email: EmailStr
    role: str # Admin, Analyst, Viewer, Service

class RoleChangeRequest(BaseModel):
    role: str

@router.post("/users/invite", response_model=dict)
async def invite_user(
    req: UserInviteRequest, 
    ctx: UserContext = Depends(RoleChecker(["Admin"]))
):
    """
    Creates a new Firebase Auth user, sets custom claims, and registers them in Firestore.
    Specifically for the current tenant.
    """
    if req.role not in ["Admin", "Analyst", "Viewer", "Service"]:
        raise HTTPException(status_code=400, detail="Invalid role specified.")

    try:
        # 1. Create user in Firebase Auth
        user_record = auth.create_user(
            email=req.email,
            email_verified=False,
            disabled=False
        )
        
        # 2. Set Custom Claims
        auth.set_custom_user_claims(user_record.uid, {
            "tenantId": ctx.tenant_id,
            "role": req.role
        })
        
        # 3. Create document in Firestore
        user_doc = {
            "uid": user_record.uid,
            "email": req.email,
            "tenantId": ctx.tenant_id,
            "role": req.role,
            "status": "active",
            "createdAt": datetime.now(UTC),
            "createdBy": ctx.uid,
            "last_seen": datetime.now(UTC)
        }
        db.collection("users").document(user_record.uid).set(user_doc)
        
        # 4. Generate password reset link for initial setup (Invite loop)
        invite_link = auth.generate_password_reset_link(req.email)
        
        # 5. Log audit event
        await log_audit_event(
            action="USER_INVITED",
            actor_uid=ctx.uid,
            actor_role=ctx.role,
            tenant_id=ctx.tenant_id,
            target_uid=user_record.uid,
            metadata={"email": req.email, "role": req.role}
        )
        
        return {
            "uid": user_record.uid,
            "email": req.email,
            "status": "success",
            "inviteLink": invite_link # In production, this should be sent via email
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to invite user: {str(e)}")

@router.post("/users/{uid}/role", response_model=dict)
async def change_user_role(
    uid: str,
    req: RoleChangeRequest,
    ctx: UserContext = Depends(RoleChecker(["Admin"]))
):
    """
    Updates a user's role in both Firebase Custom Claims and Firestore.
    """
    if req.role not in ["Admin", "Analyst", "Viewer", "Service"]:
        raise HTTPException(status_code=400, detail="Invalid role.")

    user_ref = db.collection("users").document(uid)
    doc = user_ref.get()
    
    if not doc.exists or doc.to_dict().get("tenantId") != ctx.tenant_id:
        raise HTTPException(status_code=404, detail="User not found in your tenant.")

    try:
        # Update custom claims
        current_claims = auth.get_user(uid).custom_claims or {}
        current_claims["role"] = req.role
        auth.set_custom_user_claims(uid, current_claims)
        
        # Update Firestore
        user_ref.update({"role": req.role})
        
        await log_audit_event(
            action="ROLE_CHANGED",
            actor_uid=ctx.uid,
            actor_role=ctx.role,
            tenant_id=ctx.tenant_id,
            target_uid=uid,
            metadata={"new_role": req.role}
        )
        
        return {"status": "success", "message": f"Role updated to {req.role}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/users/{uid}/disable", response_model=dict)
async def disable_user(
    uid: str,
    ctx: UserContext = Depends(RoleChecker(["Admin"]))
):
    """
    Disables a user account and revokes their refresh tokens.
    """
    user_ref = db.collection("users").document(uid)
    doc = user_ref.get()
    
    if not doc.exists or doc.to_dict().get("tenantId") != ctx.tenant_id:
        raise HTTPException(status_code=404, detail="User not found.")

    try:
        # Disable in Firebase Auth
        auth.update_user(uid, disabled=True)
        # Revoke sessions
        auth.revoke_refresh_tokens(uid)
        # Update Firestore
        user_ref.update({"status": "disabled"})
        
        await log_audit_event(
            action="USER_DISABLED",
            actor_uid=ctx.uid,
            actor_role=ctx.role,
            tenant_id=ctx.tenant_id,
            target_uid=uid
        )
        
        return {"status": "success", "message": "User disabled and tokens revoked."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/users/{uid}/revoke", response_model=dict)
async def revoke_tokens(
    uid: str,
    ctx: UserContext = Depends(RoleChecker(["Admin"]))
):
    """
    Forces a user logout by revoking Firebase refresh tokens.
    """
    # Verify tenant ownership
    user_ref = db.collection("users").document(uid)
    doc = user_ref.get()
    if not doc.exists or doc.to_dict().get("tenantId") != ctx.tenant_id:
        raise HTTPException(status_code=404, detail="User not found.")

    try:
        auth.revoke_refresh_tokens(uid)
        await log_audit_event(
            action="TOKENS_REVOKED",
            actor_uid=ctx.uid,
            actor_role=ctx.role,
            tenant_id=ctx.tenant_id,
            target_uid=uid
        )
        return {"status": "success", "message": "Tokens revoked."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

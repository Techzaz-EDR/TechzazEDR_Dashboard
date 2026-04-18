from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth
from pydantic import BaseModel
from typing import List, Optional
from app.core.firebase import db, firebase_auth
from app.core.config import settings

security = HTTPBearer()

async def resolve_tenant_by_api_key(api_key: str) -> str:
    """
    Looks up the organization associated with an API key in Firestore.
    """
    if not api_key:
        raise HTTPException(status_code=403, detail="X-API-Key header is required")

    # Optional: Allow the master demo key for development/demo purposes
    if api_key == settings.ALERTS_API_KEY:
        return "demo-org"

    # Query organizations for matching api_key
    org_docs = db.collection("organizations").where("api_key", "==", api_key).limit(1).stream()
    for doc in org_docs:
        return doc.id
    
    raise HTTPException(status_code=403, detail="Invalid or unauthorized API key.")

class UserContext(BaseModel):
    uid: str
    email: Optional[str] = None
    tenant_id: str
    role: str

async def get_current_user(res: HTTPAuthorizationCredentials = Depends(security)) -> UserContext:
    """
    Verifies the Firebase ID token and extracts custom claims (tenantId, role).
    """
    token = res.credentials
    try:
        # Verify the ID token while checking for revocations
        decoded_token = auth.verify_id_token(token, check_revoked=True)
        
        # Extract custom claims
        tenant_id = decoded_token.get("tenantId")
        role = decoded_token.get("role")
        
        if not tenant_id or not role:
            # Fallback: Check Firestore users collection
            user_ref = db.collection("users").document(decoded_token["uid"])
            user_snap = user_ref.get()
            
            if user_snap.exists:
                user_data = user_snap.to_dict()
                tenant_id = tenant_id or user_data.get("tenantId")
                role = role or user_data.get("role")
                
                # If we found missing claims in Firestore, attempt to sync them back to Auth
                # so the next token refresh includes them.
                if user_data.get("tenantId") and user_data.get("role"):
                    try:
                        auth.set_custom_user_claims(decoded_token["uid"], {
                            "tenantId": user_data.get("tenantId"),
                            "role": user_data.get("role")
                        })
                    except Exception as e:
                        print(f"[AUTH FALLBACK] Failed to sync claims: {str(e)}")

        if not tenant_id or not role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User missing required security claims (tenantId or role)."
            )
            
        return UserContext(
            uid=decoded_token["uid"],
            email=decoded_token.get("email"),
            tenant_id=tenant_id,
            role=role
        )
    except auth.RevokedIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked. Please log in again."
        )
    except auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token."
        )
    except HTTPException:
        # Re-raise HTTPExceptions (e.g. from missing claims)
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}"
        )

class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: UserContext = Depends(get_current_user)):
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{user.role}' does not have sufficient permissions. Required: {self.allowed_roles}"
            )
        return user

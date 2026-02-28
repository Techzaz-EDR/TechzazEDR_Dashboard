from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth
from pydantic import BaseModel
from typing import List, Optional
from app.core.firebase import firebase_auth

security = HTTPBearer()

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

import pytest
from unittest.mock import MagicMock, patch
from fastapi import HTTPException
from app.core.auth import get_current_user, RoleChecker, UserContext
from firebase_admin import auth

# Mock the authorization credentials
class MockCredentials:
    def __init__(self, token):
        self.credentials = token

@pytest.mark.asyncio
async def test_get_current_user_success():
    # Setup mock decoded token
    mock_token = {
        "uid": "test_uid",
        "email": "test@example.com",
        "tenantId": "tenant_123",
        "role": "Admin"
    }
    
    with patch("firebase_admin.auth.verify_id_token", return_value=mock_token):
        res = MockCredentials("valid_token")
        user = await get_current_user(res)
        
        assert user.uid == "test_uid"
        assert user.tenant_id == "tenant_123"
        assert user.role == "Admin"

@pytest.mark.asyncio
async def test_get_current_user_missing_claims():
    # Token valid but missing tenantId or role
    mock_token = {
        "uid": "test_uid",
        "email": "test@example.com"
        # tenantId and role missing
    }
    
    with patch("firebase_admin.auth.verify_id_token", return_value=mock_token):
        res = MockCredentials("valid_token")
        with pytest.raises(HTTPException) as excinfo:
            await get_current_user(res)
        assert excinfo.value.status_code == 403
        assert "missing required security claims" in excinfo.value.detail

@pytest.mark.asyncio
async def test_role_checker_allowed():
    user = UserContext(uid="123", tenant_id="t1", role="Analyst")
    checker = RoleChecker(["Admin", "Analyst"])
    
    # Should not raise any exception
    result = checker(user)
    assert result == user

@pytest.mark.asyncio
async def test_role_checker_denied():
    user = UserContext(uid="123", tenant_id="t1", role="Viewer")
    checker = RoleChecker(["Admin", "Analyst"])
    
    with pytest.raises(HTTPException) as excinfo:
        checker(user)
    assert excinfo.value.status_code == 403
    assert "sufficient permissions" in excinfo.value.detail

@pytest.mark.asyncio
async def test_get_current_user_revoked():
    with patch("firebase_admin.auth.verify_id_token", side_effect=auth.RevokedIdTokenError({"message": "Revoked"})):
        res = MockCredentials("revoked_token")
        with pytest.raises(HTTPException) as excinfo:
            await get_current_user(res)
        assert excinfo.value.status_code == 401
        assert "revoked" in excinfo.value.detail.lower()

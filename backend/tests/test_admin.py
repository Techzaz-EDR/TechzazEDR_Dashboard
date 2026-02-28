import pytest
from unittest.mock import MagicMock, patch, ANY, AsyncMock
from fastapi import HTTPException
from app.api.admin import invite_user, change_user_role, UserInviteRequest, RoleChangeRequest
from app.core.auth import UserContext
from firebase_admin import auth

@pytest.fixture
def admin_ctx():
    return UserContext(uid="admin_1", email="admin@test.com", tenant_id="t123", role="Admin")

@pytest.mark.asyncio
async def test_invite_user_success(admin_ctx):
    req = UserInviteRequest(email="new@user.com", role="Analyst")
    
    mock_user_record = MagicMock()
    mock_user_record.uid = "new_uid"
    
    with patch("firebase_admin.auth.create_user", return_value=mock_user_record) as mock_create, \
         patch("firebase_admin.auth.set_custom_user_claims") as mock_set_claims, \
         patch("firebase_admin.auth.generate_password_reset_link", return_value="http://reset") as mock_link, \
         patch("app.core.firebase.db.collection") as mock_db, \
         patch("app.api.admin.log_audit_event", new_callable=AsyncMock) as mock_audit:
        
        # Mock Firestore chaining
        mock_doc = MagicMock()
        mock_db.return_value.document.return_value = mock_doc
        
        result = await invite_user(req, admin_ctx)
        
        assert result["uid"] == "new_uid"
        assert result["email"] == "new@user.com"
        assert result["inviteLink"] == "http://reset"
        
        # Verify claims were set with tenantId
        mock_set_claims.assert_called_with("new_uid", {"tenantId": "t123", "role": "Analyst"})
        # Verify Firestore write
        mock_doc.set.assert_called_once()
        # Verify audit log
        mock_audit.assert_called_once()

@pytest.mark.asyncio
async def test_invite_user_invalid_role(admin_ctx):
    req = UserInviteRequest(email="new@user.com", role="SuperUser") # Invalid role
    
    with pytest.raises(HTTPException) as excinfo:
        await invite_user(req, admin_ctx)
    assert excinfo.value.status_code == 400
    assert "Invalid role" in excinfo.value.detail

@pytest.mark.asyncio
async def test_change_role_not_found(admin_ctx):
    req = RoleChangeRequest(role="Viewer")
    
    with patch("app.core.firebase.db.collection") as mock_db:
        mock_doc = MagicMock()
        mock_doc.get.return_value.exists = False
        mock_db.return_value.document.return_value = mock_doc
        
        with pytest.raises(HTTPException) as excinfo:
            await change_user_role("missing_uid", req, admin_ctx)
        assert excinfo.value.status_code == 404

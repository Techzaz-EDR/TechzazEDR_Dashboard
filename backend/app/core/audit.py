from datetime import datetime, UTC
from typing import Any, Dict, Optional
from app.core.firebase import db

async def log_audit_event(
    action: str,
    actor_uid: str,
    actor_role: str,
    tenant_id: str,
    target_uid: Optional[str] = None,
    target_resource: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
):
    """
    Logs a security-relevant event to the 'audit_logs' collection.
    """
    audit_data = {
        "timestamp": datetime.now(UTC),
        "action": action,
        "actorUid": actor_uid,
        "actorRole": actor_role,
        "tenantId": tenant_id,
        "targetUid": target_uid,
        "targetResource": target_resource,
        "metadata": metadata or {}
    }
    
    # Fire and forget or await? Usually better to await to ensure logging.
    db.collection("audit_logs").add(audit_data)

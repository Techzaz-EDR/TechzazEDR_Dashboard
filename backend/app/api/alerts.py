from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends, Header
from typing import Dict, Any, Optional
from datetime import datetime
import uuid

# Assume firebase is initialized and db is available
from app.core.firebase import db
from app.core.config import settings
from app.schemas.alert import SecurityAlert

router = APIRouter()

def process_alert_background(agent_id: str, organization_id: str, alert: SecurityAlert, agent_name: Optional[str] = None, agent_ip: Optional[str] = None, agent_os: Optional[str] = None):
    alert_dict = alert.dict()
    
    # Add organization metadata
    alert_dict["organization_id"] = organization_id
    
    # Add a backend receive timestamp for tracking latency
    alert_dict["_received_at"] = datetime.utcnow().isoformat() + 'Z'
    
    # Write to Firestore: organizations/{organization_id}/agents/{agent_id}/alerts/{alert_id}
    org_ref = db.collection("organizations").document(organization_id)
    
    # Update agent last_seen/status
    agent_ref = org_ref.collection("agents").document(agent_id)
    
    # Update agent info, prioritizing the sent name if available
    agent_update = {
        "last_seen": datetime.utcnow().isoformat() + 'Z',
        "status": "online"
    }
    if agent_name:
        agent_update["hostname"] = agent_name
        agent_update["agent_name"] = agent_name

    agent_ref.set(agent_update, merge=True)

    # Conditionally set ip and os ONLY if not already present in Firestore
    existing_doc = agent_ref.get()
    existing_data = existing_doc.to_dict() if existing_doc.exists else {}
    conditional_update = {}
    if agent_ip and not existing_data.get("ip"):
        conditional_update["ip"] = agent_ip
    if agent_os and not existing_data.get("os"):
        conditional_update["os"] = agent_os
    if conditional_update:
        agent_ref.set(conditional_update, merge=True)
    
    # Add the alert document
    alert_id = str(uuid.uuid4())
    alerts_ref = agent_ref.collection("alerts").document(alert_id)
    
    alerts_ref.set(alert_dict)

@router.post("")
async def receive_alert(
    agent_id: str, 
    alert: SecurityAlert, 
    background_tasks: BackgroundTasks,
    agent_name: Optional[str] = None,
    agent_ip: Optional[str] = None,
    agent_os: Optional[str] = None,
    x_api_key: Optional[str] = Header(None)
):
    """
    Receive a security alert from an agent.
    - agent_id is passed as a query parameter (?agent_id=DESKTOP-ABC)
    - x-api-key is required in the headers
    """
    if not agent_id:
        raise HTTPException(status_code=400, detail="agent_id query parameter is required")

async def resolve_organization_from_key(api_key: str) -> str:
    """
    Looks up the organization associated with an API key in Firestore.
    """
    # Check for the global demo key if explicitly configured (optional, but following strict policy)
    if api_key == settings.ALERTS_API_KEY:
        # We still allow demo-org for the master key, or we could disable it entirely.
        # Strict policy: return demo-org only if it's the master key, otherwise lookup.
        return "demo-org"

    org_docs = db.collection("organizations").where("api_key", "==", api_key).limit(1).stream()
    for doc in org_docs:
        return doc.id
    
    raise HTTPException(status_code=403, detail="Invalid or unauthorized API key.")

@router.post("")
async def receive_alert(
    agent_id: str, 
    alert: SecurityAlert, 
    background_tasks: BackgroundTasks,
    agent_name: Optional[str] = None,
    agent_ip: Optional[str] = None,
    agent_os: Optional[str] = None,
    x_api_key: Optional[str] = Header(None)
):
    """
    Receive a security alert from an agent.
    - agent_id is passed as a query parameter (?agent_id=DESKTOP-ABC)
    - x-api-key is required in the headers
    """
    if not agent_id:
        raise HTTPException(status_code=400, detail="agent_id query parameter is required")

    if not x_api_key:
        raise HTTPException(status_code=403, detail="X-API-Key header is required")

    # Resolve organization from API key
    organization_id = await resolve_organization_from_key(x_api_key)

    # Add to background tasks so the agent gets an immediate 202 response
    background_tasks.add_task(process_alert_background, agent_id, organization_id, alert, agent_name, agent_ip, agent_os)
    
    return {"status": "accepted", "message": "Alert queued for processing", "tenant_id": organization_id}

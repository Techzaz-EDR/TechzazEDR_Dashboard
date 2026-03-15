from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends, Header
from typing import Dict, Any, Optional
from datetime import datetime
import uuid

# Assume firebase is initialized and db is available
from app.core.firebase import db
from app.core.config import settings
from app.schemas.alert import SecurityAlert

router = APIRouter()

def process_alert_background(agent_id: str, organization_id: str, alert: SecurityAlert):
    alert_dict = alert.dict()
    
    # Add organization metadata
    alert_dict["organization_id"] = organization_id
    
    # Add a backend receive timestamp for tracking latency
    alert_dict["_received_at"] = datetime.utcnow().isoformat()
    
    # Write to Firestore: organizations/{organization_id}/agents/{agent_id}/alerts/{alert_id}
    org_ref = db.collection("organizations").document(organization_id)
    
    # Update agent last_seen/status
    agent_ref = org_ref.collection("agents").document(agent_id)
    agent_ref.set({
        "last_seen": datetime.utcnow().isoformat(),
        "status": "online"
    }, merge=True)
    
    # Add the alert document
    alert_id = str(uuid.uuid4())
    alerts_ref = agent_ref.collection("alerts").document(alert_id)
    
    alerts_ref.set(alert_dict)

@router.post("")
async def receive_alert(
    agent_id: str, 
    alert: SecurityAlert, 
    background_tasks: BackgroundTasks,
    x_api_key: Optional[str] = Header(None)
):
    """
    Receive a security alert from an agent.
    - agent_id is passed as a query parameter (?agent_id=DESKTOP-ABC)
    - x-api-key is required in the headers
    """
    if not agent_id:
        raise HTTPException(status_code=400, detail="agent_id query parameter is required")

    if not x_api_key or x_api_key != settings.ALERTS_API_KEY:
        raise HTTPException(
            status_code=403, 
            detail="Invalid or missing API Key"
        )

    # For testing, we map the demo key to "demo-org"
    # and override agent_id to "DESKTOP-TEST1" as requested
    organization_id = "demo-org"
    agent_id = "DESKTOP-TEST1"

    # Add to background tasks so the agent gets an immediate 202 response
    background_tasks.add_task(process_alert_background, agent_id, organization_id, alert)
    
    return {"status": "accepted", "message": "Alert queued for processing"}

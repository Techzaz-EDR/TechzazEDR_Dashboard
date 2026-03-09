from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from datetime import datetime
import uuid

# Assume firebase is initialized and db is available
from app.core.firebase import db

router = APIRouter()

class SecurityAlert(BaseModel):
    Timestamp: str
    RuleId: str
    Category: str
    Severity: str
    Status: str
    organization_id: str
    Details: Dict[str, Any]

def process_alert_background(agent_id: str, alert: SecurityAlert):
    organization_id = alert.organization_id
    alert_dict = alert.dict()
    
    # We don't need organization_id inside the document if it's already in the path, but we keep it if the schema demands it
    # Add a backend receive timestamp for tracking latency
    alert_dict["_received_at"] = datetime.utcnow().isoformat()
    
    # Write to Firestore: organizations/{organization_id}/agents/{agent_id}/alerts/{alert_id}
    # Create the org ref (implicitly created if not exists, but we did explicit creation)
    org_ref = db.collection("organizations").document(organization_id)
    
    # Update agent last_seen/status
    agent_ref = org_ref.collection("agents").document(agent_id)
    agent_ref.set({
        "last_seen": datetime.utcnow().isoformat(),
        "status": "online"
    }, merge=True)
    
    # Add the alert document
    alert_id = str(uuid.uuid4()) # Or use a hash of the alert data for deduplication
    alerts_ref = agent_ref.collection("alerts").document(alert_id)
    
    alerts_ref.set(alert_dict)

@router.post("")
async def receive_alert(agent_id: str, alert: SecurityAlert, background_tasks: BackgroundTasks):
    """
    Receive a security alert from an agent.
    - agent_id is passed as a query parameter (?agent_id=DESKTOP-ABC)
    - organization_id is provided in the JSON body.
    """
    if not alert.organization_id:
        raise HTTPException(status_code=400, detail="organization_id is required in the alert payload")
        
    if not agent_id:
        raise HTTPException(status_code=400, detail="agent_id query parameter is required")

    # Add to background tasks so the agent gets an immediate 202 response
    background_tasks.add_task(process_alert_background, agent_id, alert)
    
    return {"status": "accepted", "message": "Alert queued for processing"}

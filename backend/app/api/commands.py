from fastapi import APIRouter, HTTPException, Header, Query
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.core.firebase import db
from app.core.config import settings

router = APIRouter()

@router.get("/poll")
async def poll_commands(
    agent_id: str = Query(..., description="The unique ID of the agent"),
    x_api_key: Optional[str] = Header(None)
):
    """
    Poll for pending commands for a specific agent.
    Agents should call this periodically to check for new tasks.
    """
    if not x_api_key or x_api_key != settings.ALERTS_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API Key")

    # Hardcoded for demo as per alerts.py
    organization_id = "demo-org"
    
    # query: organizations/{org}/agents/{agent}/commands where status == 'pending'
    agent_ref = db.collection("organizations").document(organization_id) \
                     .collection("agents").document(agent_id)
    
    # Update agent last_seen/status
    agent_ref.set({
        "last_seen": datetime.utcnow().isoformat() + 'Z',
        "status": "online"
    }, merge=True)

    commands_ref = agent_ref.collection("commands")
    
    query = commands_ref.where("status", "==", "pending").limit(5)
    docs = query.stream()
    
    results = []
    for doc in docs:
        cmd_data = doc.to_dict()
        cmd_data["id"] = doc.id
        # Convert Firestore Timestamp to ISO string for JSON serialization
        if "timestamp" in cmd_data and hasattr(cmd_data["timestamp"], "isoformat"):
            cmd_data["timestamp"] = cmd_data["timestamp"].isoformat()
        results.append(cmd_data)
        
    return results

@router.patch("/{command_id}")
async def update_command_status(
    command_id: str,
    status: str,
    agent_id: str = Query(..., description="The unique ID of the agent"),
    x_api_key: Optional[str] = Header(None)
):
    """
    Update the status of a specific command (e.g., to 'completed' or 'failed').
    """
    if not x_api_key or x_api_key != settings.ALERTS_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API Key")

    # Hardcoded for demo
    organization_id = "demo-org"
    
    cmd_ref = db.collection("organizations").document(organization_id) \
                .collection("agents").document(agent_id) \
                .collection("commands").document(command_id)
    
    doc = cmd_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Command not found")
    
    # Update agent last_seen as well
    agent_ref = db.collection("organizations").document(organization_id) \
                  .collection("agents").document(agent_id)
    
    agent_ref.set({
        "last_seen": datetime.utcnow().isoformat() + 'Z',
        "status": "online"
    }, merge=True)

    cmd_ref.update({
        "status": status,
        "updated_at": datetime.utcnow().isoformat() + 'Z'
    })
    
    return {"status": "success", "message": f"Command status updated to {status}"}

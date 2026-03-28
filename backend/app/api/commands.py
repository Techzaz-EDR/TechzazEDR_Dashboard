from fastapi import APIRouter, HTTPException, Header, Query, Body
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.core.firebase import db
from app.core.config import settings
import uuid

router = APIRouter()

# ---------------------------------------------------------------------------
# Shared helper — maps API key to a tenant (single-tenant demo for now)
# ---------------------------------------------------------------------------
def _resolve_org(x_api_key: Optional[str]) -> str:
    if not x_api_key or x_api_key != settings.ALERTS_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API Key")
    # In a multi-tenant setup, look up org by key in Firestore here
    return "demo-org"

# ---------------------------------------------------------------------------
# Agent-facing endpoints (used by the C# agent)
# ---------------------------------------------------------------------------

@router.get("/poll")
async def poll_commands(
    agent_id: str = Query(..., description="The unique ID of the agent"),
    agent_name: Optional[str] = None,
    agent_ip: Optional[str] = None,
    agent_os: Optional[str] = None,
    x_api_key: Optional[str] = Header(None)
):
    """
    Poll for pending commands for a specific agent.
    Agents should call this periodically to check for new tasks.
    """
    organization_id = _resolve_org(x_api_key)
    
    # query: organizations/{org}/agents/{agent}/commands where status == 'pending'
    agent_ref = db.collection("organizations").document(organization_id) \
                     .collection("agents").document(agent_id)
    
    # Update agent last_seen/status
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

    commands_ref = agent_ref.collection("commands")
    
    query = commands_ref.where("status", "==", "pending").limit(5)
    docs = query.stream()
    
    results = []
    for doc in docs:
        cmd_data = doc.to_dict()
        cmd_data["id"] = doc.id
        
        # Convert any Firestore DatetimeWithNanoseconds to ISO string for JSON serialization
        for k, v in cmd_data.items():
            if hasattr(v, "isoformat"):
                cmd_data[k] = v.isoformat()
                
        results.append(cmd_data)
        
    return results

@router.get("/{command_id}")
async def get_command(
    command_id: str,
    agent_id: str = Query(..., description="The unique ID of the agent"),
    x_api_key: Optional[str] = Header(None)
):
    """
    Get the details of a specific command.
    """
    organization_id = _resolve_org(x_api_key)
    
    cmd_ref = db.collection("organizations").document(organization_id) \
                .collection("agents").document(agent_id) \
                .collection("commands").document(command_id)
    
    doc = cmd_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Command not found")
    
    cmd_data = doc.to_dict()
    cmd_data["id"] = doc.id
    return cmd_data

class ResultUpdate(BaseModel):
    result: Optional[str] = None

# ---------------------------------------------------------------------------
# Dashboard-facing endpoints (called by Angular frontend via JWT auth)
# ---------------------------------------------------------------------------

class CreateCommandRequest(BaseModel):
    command: str
    parameters: Optional[Dict[str, Any]] = {}
    created_by: Optional[str] = "dashboard"

@router.post("/agent/{agent_id}")
async def create_command(
    agent_id: str,
    body: CreateCommandRequest,
    authorization: Optional[str] = Header(None)
):
    """
    Create a new pending command for an agent.
    Called by the dashboard — uses Admin SDK so Firestore security rules are bypassed.
    This also works for brand-new agents whose subcollections don't exist yet.
    """
    # Basic auth check: require Bearer token (Firebase ID token)
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header required")

    # For the demo org, always write to demo-org (multi-tenant: decode token to get tenantId)
    organization_id = "demo-org"

    command_id = str(uuid.uuid4())
    cmd_ref = (
        db.collection("organizations")
          .document(organization_id)
          .collection("agents")
          .document(agent_id)
          .collection("commands")
          .document(command_id)
    )

    cmd_ref.set({
        "command": body.command,
        "parameters": body.parameters or {},
        "status": "pending",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "created_by": body.created_by or "dashboard"
    })

    return {"status": "queued", "command_id": command_id, "command": body.command}

@router.patch("/{command_id}")
async def update_command_status(
    command_id: str,
    status: str = Query(..., description="The new status of the command"),
    body: Optional[ResultUpdate] = None,
    agent_id: str = Query(..., description="The unique ID of the agent"),
    agent_name: Optional[str] = None,
    agent_ip: Optional[str] = None,
    agent_os: Optional[str] = None,
    x_api_key: Optional[str] = Header(None)
):
    """
    Update the status of a specific command (e.g., to 'completed' or 'failed').
    """
    organization_id = _resolve_org(x_api_key)
    
    cmd_ref = db.collection("organizations").document(organization_id) \
                .collection("agents").document(agent_id) \
                .collection("commands").document(command_id)
    
    doc = cmd_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Command not found")
    
    cmd_data = doc.to_dict()
    
    # Update agent last_seen as well
    agent_ref = db.collection("organizations").document(organization_id) \
                  .collection("agents").document(agent_id)
    
    agent_update = {
        "last_seen": datetime.utcnow().isoformat() + 'Z',
        "status": "online"
    }
    if agent_name:
        agent_update["hostname"] = agent_name
        agent_update["agent_name"] = agent_name
    
    # Conditionally set ip and os ONLY if not already present
    existing_doc = agent_ref.get()
    existing_data = existing_doc.to_dict() if existing_doc.exists else {}
    conditional_update = {}
    if agent_ip and not existing_data.get("ip"):
        conditional_update["ip"] = agent_ip
    if agent_os and not existing_data.get("os"):
        conditional_update["os"] = agent_os

    # Side-effect: If run_test_scan is completed, save to agent metadata
    if status == "completed" and cmd_data.get("command") == "run_test_scan":
        score = body.result if body and body.result else None
        if score:
            agent_update["last_repro_score"] = score

    # Check if command was cancelled by user
    if cmd_data.get("status") == "cancelled":
        # Still update agent last_seen as the agent is online and communicative
        agent_ref.set(agent_update, merge=True)
        if conditional_update:
            agent_ref.set(conditional_update, merge=True)
        return {"status": "success", "message": "Command is cancelled, skipping update"}

    agent_ref.set(agent_update, merge=True)
    if conditional_update:
        agent_ref.set(conditional_update, merge=True)

    update_data: Dict[str, Any] = {
        "status": status,
        "updated_at": datetime.utcnow().isoformat() + 'Z'
    }
    
    if body and body.result:
        update_data["result"] = body.result

    cmd_ref.update(update_data)
    
    return {"status": "success", "message": f"Command status updated to {status}"}

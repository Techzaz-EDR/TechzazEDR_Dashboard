from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
import uuid
from app.core.auth import UserContext, RoleChecker
from app.core.config import settings
from app.core.firebase import db

router = APIRouter()

class BootstrapRequest(BaseModel):
    hostname: str          # Display name for the new agent (shown in UI)
    os_type: Optional[str] = "Windows"
    device_type: Optional[str] = "Workstation"

@router.post("/bootstrap")
async def generate_bootstrap_script(
    req: BootstrapRequest,
    ctx: UserContext = Depends(RoleChecker(["Admin", "Analyst"]))
):
    """
    Generates a PowerShell bootstrap script for the EDR agent.
    - agent_id: a stable UUID generated server-side (Firestore key, never changes)
    - agent_name: the user-provided hostname (display label, can be changed later)
    """
    # Fetch organization API key from Firestore
    org_ref = db.collection("organizations").document(ctx.tenant_id)
    org_doc = org_ref.get()
    if org_doc.exists:
        api_key = org_doc.to_dict().get("api_key", settings.ALERTS_API_KEY)
    else:
        api_key = settings.ALERTS_API_KEY

    # Generate a stable UUID as the immutable agent identifier
    agent_id = str(uuid.uuid4())
    # The hostname the admin typed is the initial display name
    agent_name = req.hostname

    template_path = os.path.join(os.path.dirname(__file__), "..", "templates", "bootstrap.ps1")

    try:
        with open(template_path, "r", encoding="utf-8") as f:
            ps_template = f.read()

        # Inject identity placeholders
        ps_template = ps_template.replace("{{AGENT_ID}}", agent_id)
        ps_template = ps_template.replace("{{AGENT_NAME}}", agent_name)
        ps_template = ps_template.replace("{{API_KEY}}", api_key)
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Bootstrap template file not found on the server.")

    filename = f"bootstrap_{agent_name.lower().replace(' ', '_')}.ps1"

    return {
        "agent_id": agent_id,
        "agent_name": agent_name,
        "script_content": ps_template.strip(),
        "filename": filename
    }

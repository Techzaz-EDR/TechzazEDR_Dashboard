from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
from app.core.auth import UserContext, RoleChecker
from app.core.config import settings
from app.core.firebase import db

router = APIRouter()

class BootstrapRequest(BaseModel):
    hostname: str
    os_type: Optional[str] = "Windows"
    device_type: Optional[str] = "Workstation"

@router.post("/bootstrap")
async def generate_bootstrap_script(
    req: BootstrapRequest,
    ctx: UserContext = Depends(RoleChecker(["Admin", "Analyst"]))
):
    """
    Generates a PowerShell bootstrap script for the EDR agent.
    """
    # Fetch organization details from Firestore
    org_ref = db.collection("organizations").document(ctx.tenant_id)
    org_doc = org_ref.get()
    
    if org_doc.exists:
        org_data = org_doc.to_dict()
        api_key = org_data.get("api_key", settings.ALERTS_API_KEY)
    else:
        # Fallback to demo key if org doc not found
        api_key = settings.ALERTS_API_KEY
        
    hostname = req.hostname
    
    template_path = os.path.join(os.path.dirname(__file__), "..", "templates", "bootstrap.ps1")
    
    try:
        with open(template_path, "r", encoding="utf-8") as f:
            ps_template = f.read()
            
        # Replace placeholders
        # If hostname is GENERIC, the template handles UUID generation internally
        ps_template = ps_template.replace("{{AGENT_ID}}", hostname)
        ps_template = ps_template.replace("{{API_KEY}}", api_key)
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Bootstrap template file not found on the server.")
    
    filename = "techzaz_bootstrap.ps1" if hostname == "GENERIC" else f"bootstrap_{hostname.lower()}.ps1"
    
    return {
        "hostname": hostname,
        "script_content": ps_template.strip(),
        "filename": filename
    }

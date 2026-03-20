from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
from app.core.auth import UserContext, RoleChecker
from app.core.config import settings

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
    # In a real multi-tenant app, we would fetch the specific API Key for ctx.tenant_id
    # For this demo, we use the global ALERTS_API_KEY
    api_key = settings.ALERTS_API_KEY
    hostname = req.hostname
    
    template_path = os.path.join(os.path.dirname(__file__), "..", "templates", "bootstrap.ps1")
    
    try:
        with open(template_path, "r", encoding="utf-8") as f:
            ps_template = f.read()
            
        # Replace placeholders
        ps_template = ps_template.replace("{{AGENT_ID}}", hostname)
        ps_template = ps_template.replace("{{API_KEY}}", api_key)
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Bootstrap template file not found on the server.")
    
    return {
        "hostname": hostname,
        "script_content": ps_template.strip(),
        "filename": f"bootstrap_{hostname.lower()}.ps1"
    }

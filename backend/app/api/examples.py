from fastapi import APIRouter, Depends, HTTPException, status
from app.core.auth import UserContext, RoleChecker

router = APIRouter()

@router.get("/alerts", response_model=list)
async def get_alerts(
    ctx: UserContext = Depends(RoleChecker(["Admin", "Analyst", "Viewer"]))
):
    """
    Example route accessible by Viewer and above.
    """
    # In a real implementation, we would filter by tenantId
    # return db.collection("alerts").where("tenantId", "==", ctx.tenant_id).stream()
    return [
        {"id": "alert_1", "type": "Malware detected", "severity": "High", "tenantId": ctx.tenant_id},
        {"id": "alert_2", "type": "Unusual login", "severity": "Medium", "tenantId": ctx.tenant_id}
    ]

@router.patch("/alerts/{alert_id}")
async def update_alert(
    alert_id: str,
    ctx: UserContext = Depends(RoleChecker(["Admin", "Analyst"]))
):
    """
    Example route accessible by Analyst and above.
    """
    return {"status": "success", "message": f"Alert {alert_id} updated by {ctx.role}."}

@router.get("/service/health")
async def service_health(
    ctx: UserContext = Depends(RoleChecker(["Service", "Admin"]))
):
    """
    Example route accessible by Service role.
    """
    return {"status": "healthy", "diagnostics": "all systems nominal"}

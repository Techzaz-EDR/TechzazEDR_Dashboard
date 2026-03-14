from pydantic import BaseModel
from typing import Dict, Any, Optional

class SecurityAlert(BaseModel):
    Timestamp: str
    RuleId: str
    Category: str
    Severity: str
    Status: str
    Details: Dict[str, Any]

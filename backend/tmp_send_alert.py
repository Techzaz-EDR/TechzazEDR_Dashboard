import requests
import json
from datetime import datetime

url = "http://localhost:8000/api/v1/alerts?agent_id=DESKTOP-TEST1"
headers = {
    "x-api-key": "tz_demo_d3m00rgk3y",
    "Content-Type": "application/json"
}

alert_payload = {
    "Timestamp": datetime.utcnow().isoformat(),
    "RuleId": "TEST_ALERT_001",
    "Category": "Malware Detection",
    "Severity": "High",
    "Status": "new",
    "Details": {
        "description": "Suspicious file activity detected in C:\\Windows\\Temp",
        "file_path": "C:\\Windows\\Temp\\malware.exe",
        "process_id": 1234
    }
}

try:
    response = requests.post(url, headers=headers, json=alert_payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")

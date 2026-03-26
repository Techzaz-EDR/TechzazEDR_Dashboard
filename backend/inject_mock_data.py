import os
import uuid
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timedelta
import random

# Load .env manually for simplicity in this script
def load_env(path):
    env_vars = {}
    with open(path, "r") as f:
        for line in f:
            if "=" in line and not line.startswith("#"):
                key, val = line.strip().split("=", 1)
                env_vars[key] = val.strip('"')
    return env_vars

def inject_data():
    env = load_env(".env")
    
    # Construct credentials
    private_key = env.get("FIREBASE_PRIVATE_KEY", "").replace('\\n', '\n')
    cred_dict = {
        "type": env.get("FIREBASE_TYPE"),
        "project_id": env.get("FIREBASE_PROJECT_ID"),
        "private_key_id": env.get("FIREBASE_PRIVATE_KEY_ID"),
        "private_key": private_key,
        "client_email": env.get("FIREBASE_CLIENT_EMAIL"),
        "client_id": env.get("FIREBASE_CLIENT_ID"),
        "auth_uri": env.get("FIREBASE_AUTH_URI"),
        "token_uri": env.get("FIREBASE_TOKEN_URI"),
        "auth_provider_x509_cert_url": env.get("FIREBASE_AUTH_PROVIDER_X509_CERT_URL"),
        "client_x509_cert_url": env.get("FIREBASE_CLIENT_X509_CERT_URL"),
        "universe_domain": env.get("FIREBASE_UNIVERSE_DOMAIN")
    }
    
    if not firebase_admin._apps:
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)
    
    db = firestore.client()
    organization_id = "demo-org"
    
    agents = [
        {"id": "DESKTOP-FINANCE-01", "name": "Finance Workstation", "os": "Windows 11", "ip": "192.168.1.45"},
        {"id": "SRV-WEB-PROD-01", "name": "Production Web Server", "os": "Windows Server 2022", "ip": "10.0.0.101"},
        {"id": "LAPTOP-HR-02", "name": "HR Laptop", "os": "Windows 10", "ip": "192.168.1.112"},
        {"id": "DESKTOP-EXEC-05", "name": "Executive Desktop", "os": "Windows 11Pro", "ip": "192.168.1.20"}
    ]
    
    rule_templates = [
        {"RuleId": "MAL-402", "Category": "Malware", "Title": "Ransomware Behavior Detected"},
        {"RuleId": "SYS-101", "Category": "System", "Title": "Unusual Registry Modification"},
        {"RuleId": "NET-205", "Category": "Network", "Title": "Suspicious Port Scanning"},
        {"RuleId": "MAL-500", "Category": "Malware", "Title": "Malicious Process Execution"},
        {"RuleId": "SEC-080", "Category": "Security", "Title": "Local Administrator Group Change"}
    ]

    severities = ["Low", "Medium", "High", "Critical"]
    statuses = ["Open", "In Review", "Resolved"]

    print(f"Injecting data for {len(agents)} agents into organization: {organization_id}...")

    for agent_info in agents:
        agent_id = agent_info["id"]
        agent_ref = db.collection("organizations").document(organization_id).collection("agents").document(agent_id)
        
        # Set/Update agent info
        agent_ref.set({
            "hostname": agent_id,
            "display_name": agent_info["name"],
            "os": agent_info["os"],
            "ip_address": agent_info["ip"],
            "last_seen": firestore.SERVER_TIMESTAMP,
            "status": "online",
            "organization_id": organization_id
        }, merge=True)
        
        print(f"  -> Processed agent: {agent_id}")

        # Add 3 mock alerts for each agent
        for i in range(3):
            alert_id = str(uuid.uuid4())
            rule = random.choice(rule_templates)
            severity = random.choice(severities)
            status = random.choice(statuses)
            
            # Use random offset for timestamps to make them look real
            timestamp = datetime.utcnow() - timedelta(minutes=random.randint(1, 120))
            
            alert_data = {
                "Timestamp": timestamp.isoformat() + "Z",
                "RuleId": rule["RuleId"],
                "Title": rule["Title"],
                "Category": rule["Category"],
                "Severity": severity,
                "Status": status,
                "organization_id": organization_id,
                "agent_id": agent_id,
                "Details": {
                    "source_process": "System",
                    "description": f"Encountered suspicious activity on {agent_id} related to {rule['Title']}.",
                    "mitigation": "Isolated host from network." if severity in ["High", "Critical"] else "Monitoring for further activity."
                }
            }
            
            agent_ref.collection("alerts").document(alert_id).set(alert_data)
            print(f"     + Added alert: {rule['RuleId']} ({severity})")

    print("\nData injection complete!")

if __name__ == "__main__":
    inject_data()

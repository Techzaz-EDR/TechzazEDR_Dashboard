# TechzazEDR Backend API

The TechzazEDR Backend is a high-performance, asynchronous REST API built with FastAPI. It handles threat telemetry ingestion, multi-tenant orchestration, and administrative workflows.

## 🚀 Key Responsibilities

- **Alert Ingestion**: Secured endpoint for agents to push telemetry.
- **Organization Management**: Multi-tenant isolation and tenant provisioning.
- **RBAC (Role-Based Access Control)**: Managing users through Firebase Auth Custom Claims.
- **Audit Logging**: Tracking sensitive administrative actions.
- **Real-time Synchronization**: Bridging the gap between the .NET Agents and the Angular Frontend.

## 📦 Module Functions

The backend is organized into functional API modules, each handling a specific domain of the security ecosystem.

### 🔌 Alerts Module (`api/alerts.py`)
- **Telemetry Ingestion**: Highly optimized POST endpoint for agent alert streaming.
- **Background Processing**: Queues alerts for non-blocking persistence to Firestore.
- **Agent Pulse**: Updates the `last_seen` and `status` of agents upon every received alert.

### 🛡️ Admin Module (`api/admin.py`)
- **User Invitation Engine**: Manages the lifecycle of user invitations, from creation to Firestore registration.
- **RBAC Orchestration**: Dynamically assigns and updates Firebase Custom Claims (Admin, Analyst, Viewer).
- **Session Control**: Provides functions to disable users and revoke refresh tokens immediately.

### 🏢 Organization Module (`initialize_orgs.py`)
- **Tenant Provisioning**: Standardized script for bootstrapping new organizations and demo tenants.
- **Schema Enforcement**: Ensures the Firestore hierarchical structure is correctly initialized.

### 🔐 Security Core (`core/auth.py`)
- **JWT Middleware**: Validates incoming bearer tokens and extracts tenant/role context.
- **Rate Limiting**: Protects high-traffic ingestion endpoints from resource exhaustion.

## 🏗️ Technical Architecture

### Tech Stack
- **FastAPI**: Modern, fast (high-performance), web framework for building APIs with Python 3.13+.
- **Firestore**: Scalable NoSQL database for real-time data storage.
- **Firebase Auth**: Robust authentication provider.
- **Pydantic**: Data validation and settings management using Python type hints.

### Data Model (Firestore)
```text
organizations/
  └── {tenant_id}/
      ├── agents/
      │   └── {agent_id}/
      │       ├── last_seen
      │       ├── status
      │       └── alerts/
      │           └── {alert_id}/
      │               ├── RuleId
      │               ├── Category
      │               ├── Severity
      │               └── Details {}
users/
  └── {uid}/
      ├── email
      ├── tenantId
      ├── role
      └── status
```

## ⚙️ Configuration

The application uses Pydantic Settings and a `.env` file for configuration.

| Variable | Description | Default |
|:---|:---|:---|
| `PROJECT_NAME` | Display name of the API | Techzaz EDR Dashboard |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Path to your GCP JSON key | `firebase-service-account.json` |
| `FIREBASE_PROJECT_ID` | Your Firebase Project ID | `techzazedr` |
| `ALERTS_API_KEY` | Global key for agent ingestion | `tz_demo_d3m00rgk3y` |

## 🛠️ Setup & Development

### 1. Environment Setup
```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux/macOS
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Firebase Initialization
Ensure `firebase-service-account.json` is present in the `backend/` root. Run the seeding script to create the initial organization:
```bash
python initialize_orgs.py
```

### 3. Run the Server
```bash
python run.py
```
*API will be available at http://127.0.0.1:8000/*

## 🧪 Testing & Docs

- **Interactive API Documentation**: Found at `/docs` (Swagger) or `/redoc`.
- **Unit Tests**: Run with `pytest`.
- **Alert Injection**: Use `inject_alert.py` to simulate agent telemetry for testing.

---
> [!NOTE]
> For security, the `ALERTS_API_KEY` should be rotated periodically in production environments.

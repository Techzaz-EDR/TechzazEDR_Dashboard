# TechzazEDR Dashboard

A modern, high-performance Endpoint Detection and Response (EDR) dashboard built with a decoupled architecture using Angular and FastAPI.

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Frontend Setup](#frontend-setup)
  - [Backend Setup](#backend-setup)
- [Git Workflow](#git-workflow)
- [API Documentation](#api-documentation)

---

## Overview
TechzazEDR Dashboard is designed to provide real-time monitoring and management of endpoint security. It features a sleek, responsive frontend and a robust, scalable backend API.

## Architecture
The project follows a modern **Frontend-Backend (Decoupled)** and **Multi-Tenant SaaS** architecture:
- **Frontend**: A single-page application (SPA) that communicates with the API.
- **Backend**: A RESTful API that handles data processing, security logic, and database interactions.
- **Database (Firestore)**: Implements rigid data isolation with hierarchical paths: `organizations/{organization_id}/agents/{agent_id}/alerts/{alert_id}`.

## Tech Stack

### Frontend
- **Framework**: [Angular](https://angular.io/) (v21+)
- **Styling**: SCSS (Vanilla CSS principles)
- **Animations**: GSAP
- **Icons**: Lucide Angular
- **Build Tool**: Angular CLI / Vite (development server)

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **Runtime**: Python 3.13.5
- **Server**: Uvicorn
- **Settings**: Pydantic Settings (Environment-based config)

---

## Project Structure

```text
TechzazEDR_Dashboard/
├── frontend/             # Angular SPA
│   ├── src/
│   │   ├── app/          # Components, Services, Routes
│   │   └── main.ts       # Application Entry
│   └── package.json      # Frontend Dependencies
├── backend/              # FastAPI REST API
│   ├── app/              # Application Logic
│   │   ├── api/          # Route Handlers
│   │   ├── core/         # Config & Settings
│   │   ├── models/       # Database Models
│   │   └── schemas/      # Pydantic Schemas
│   ├── .venv/            # Python Virtual Environment
│   ├── run.py            # Development Server Entry
│   └── requirements.txt  # Python Dependencies
└── README.md             # This Document
```

---

## Getting Started

### Frontend Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm start
   ```
   *The frontend will be available at http://localhost:4200/*

### Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment (if not present):
   ```powershell
   py -m venv .venv
   .venv\Scripts\Activate.ps1
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Initialize the Multi-Tenant Database (Firestore):
   ```bash
   python initialize_orgs.py
   ```
5. Run the development server:
   ```bash
   python run.py
   ```
   *The backend API will be available at http://127.0.0.1:8000/*

---

## Git Workflow
The project uses a multi-branch strategy:
- `main`: Production-ready code.
- `inuka`: Active development branch.

**To push changes:**
```bash
git add .
git commit -m "Your descriptive message"
git push origin inuka  # Push to dev branch
git push origin main   # Push to main branch
```

## API Documentation
Once the backend is running, you can access interactive documentation:
- **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

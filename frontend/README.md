# TechzazEDR Frontend

A premium, modern security operations console built with **Angular 21** and **GSAP**. This dashboard provides a real-time, high-fidelity view of the threats detected across the enterprise.

## ✨ Features

- **Signal-Based State Management**: Leveraging Angular's newest reactivity model for high performance.
- **Real-time Telemetry Updates**: Direct integration with Firestore for live alert streams.
- **Proactive UI**: Advanced data visualizations and threat analytics.
- **Ultra-Smooth UI**: GSAP powered micro-animations for a premium "Defense Grade" feel.
- **Multitenancy Aware**: Fully handles tenant switching and RBAC-controlled views.

## 🖼️ Dashboard Views & Functions

The frontend is divided into specialized views, each optimized for a specific security operations persona.

### 📈 Overview (`dashboard/overview`)
- **Executive Summary**: High-level charts displaying alert volume by severity and category.
- **Top Threats**: Dynamic list of the most frequent or critical rules triggered across the fleet.
- **System Health**: Aggregate status of all registered agents (Online vs. Offline).

### 🖥️ Endpoints (`dashboard/endpoints`)
- **Fleet Management**: Searchable and filterable table of all agents in the organization.
- **Host Details**: Deep dive into specific machine metadata, including OS version and last-seen metrics.
- **Status Tracking**: Visual indicators for real-time agent connectivity.

### 🚨 Incidents (`dashboard/incidents`)
- **Investigation Workbench**: Comprehensive table of all received alerts with advanced search capabilities.
- **Threat Details**: Side-pane preview and full-page investigation views for individual alerts.
- **Triage Actions**: (Planned) Workflows for status updates and incident remediation.

### ⚙️ Settings (`settings/`)
- **Organization Control**: Manage global tenant settings and API key visibility.
- **Security Posture**: Configure user profiles and notification preferences.

## 🛠️ Technology Stack

- **Framework**: Angular 21
- **State**: Angular Signals
- **Animations**: GSAP (GreenSock Animation Platform)
- **Icons**: Lucide Angular
- **Styling**: SCSS (CSS Variables + Modular Architecture)
- **Build Tool**: Vite (via Angular CLI)

## 📂 Component Map

- `core/`: Strategic logic (Auth guards, JWT interceptors, API services).
- `dashboard/`:
  - `overview/`: Strategic aggregate metrics.
  - `endpoints/`: Fleet status and agent management.
  - `incidents/`: In-depth alert investigation workflow.
- `settings/`: Organization configuration and user profile management.

## 🚀 Getting Started

### Installation
```bash
npm install
```

### Development Server
```bash
npm start
```
*App will be available at http://localhost:4200/*

### Production Build
```bash
npm run build
```

---
> [!TIP]
> Use the `video/` directory to store screencaps of UI workflows for documentation purposes.
import io
import os
import fitz  # PyMuPDF
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from fastapi import APIRouter, Response, HTTPException, Depends
from fastapi.responses import Response
from datetime import datetime, timedelta
import traceback
from app.core.auth import UserContext, get_current_user
from app.core.firebase import db

router = APIRouter()

# Path to the template
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATE_PATH = os.path.join(BASE_DIR, "reports", "Security_Posture_Report_template.pdf")

def generate_donut_chart(data, title, colors, figsize=(3.5, 3.5)):
    """Generic donut chart generator."""
    labels = list(data.keys())
    values = list(data.values())
    if not values or sum(values) == 0:
        values, labels, colors = [1], ["No Data"], ["#e2e8f0"]
    
    fig, ax = plt.subplots(figsize=figsize)
    ax.pie(values, labels=labels, colors=colors[:len(labels)], autopct='%1.1f%%' if "No Data" not in labels else '', 
            startangle=90, pctdistance=0.80, textprops={'fontsize': 8, 'weight': 'bold'})
    
    centre_circle = plt.Circle((0,0), 0.70, fc='white')
    ax.add_artist(centre_circle)
    plt.title(title, pad=10, fontsize=10, weight='bold')
    ax.axis('equal')
    
    buf = io.BytesIO()
    plt.savefig(buf, format='png', transparent=True, bbox_inches='tight')
    buf.seek(0)
    plt.close(fig)
    return buf

def generate_bar_chart(data, title, color):
    """Generic horizontal bar chart for MITRE coverage."""
    labels = list(data.keys())
    values = list(data.values())
    fig, ax = plt.subplots(figsize=(5.5, 2.5))
    y_pos = range(len(labels))
    ax.barh(y_pos, values, align='center', color=color, alpha=0.8)
    ax.set_yticks(y_pos)
    ax.set_yticklabels(labels, fontsize=9)
    ax.invert_yaxis()
    ax.set_xlabel('Alert Count', fontsize=8)
    ax.set_title(title, pad=15, fontsize=10, weight='bold')
    plt.tight_layout()
    buf = io.BytesIO()
    plt.savefig(buf, format='png', transparent=True, bbox_inches='tight')
    buf.seek(0)
    plt.close(fig)
    return buf

@router.get("/security-posture")
async def get_security_posture_report(ctx: UserContext = Depends(get_current_user)):
    print(f"REPORTS: Generating real-time report for tenant: {ctx.tenant_id}")
    try:
        # --- 1. DATA AGGREGATION (REAL FIRESTORE DATA) ---
        org_id = ctx.tenant_id
        
        stats = {
            "total_endpoints": 0,
            "online_endpoints": 0,
            "offline_endpoints": 0,
            "active_incidents": 0,
            "critical_alerts": 0,
            "severity_map": {"Critical": 0, "High": 0, "Medium": 0, "Low": 0},
            "mitre_map": {},
            "target_heatmap": {}
        }

        # A. Agents & Health
        agents_ref = db.collection("organizations").document(org_id).collection("agents")
        agents = agents_ref.stream()
        for agent in agents:
            data = agent.to_dict()
            stats["total_endpoints"] += 1
            if data.get("status") == "online":
                stats["online_endpoints"] += 1
            else:
                stats["offline_endpoints"] += 1

        # B. Active Incidents
        incidents_ref = db.collection("organizations").document(org_id).collection("incidents")
        # Query for open/investigating incidents
        active_incidents = incidents_ref.where("status", "in", ["open", "investigating", "contained", "Active"]).stream()
        for inc in active_incidents:
            stats["active_incidents"] += 1

        # C. Alerts (Severity & MITRE)
        # We use organization_id field which is tagged on every alert for multi-tenant collectionGroup querying
        alerts = db.collection_group("alerts").where("organization_id", "==", org_id).stream()
        
        for alert in alerts:
            a_data = alert.to_dict()
            # If alert is resolved, skip it from the posture wrap-up
            if a_data.get("status") == "resolved":
                continue

            # Severity
            sev = (a_data.get("Severity") or a_data.get("severity") or "Medium").capitalize()
            if sev in stats["severity_map"]:
                stats["severity_map"][sev] += 1
                if sev == "Critical":
                    stats["critical_alerts"] += 1
            
            # MITRE Tactics (Aggregated from Rule or Technique fields)
            tactic = a_data.get("tactic") or a_data.get("Tactic") or "Initial Access"
            stats["mitre_map"][tactic] = stats["mitre_map"].get(tactic, 0) + 1

            # Top Targets (Heatmap)
            hostname = a_data.get("hostname") or a_data.get("agent_name") or "Unknown"
            stats["target_heatmap"][hostname] = stats["target_heatmap"].get(hostname, 0) + 1

        # Calculate a dynamic security score (simple heuristic: 100 - (critical*10 + high*5 + active_incidents*2))
        penalty = (stats["critical_alerts"] * 10) + (stats["severity_map"].get("High", 0) * 5) + (stats["active_incidents"] * 2)
        security_score = max(0, min(100, 100 - penalty))

        # --- 2. PDF GENERATION ---
        if not os.path.exists(TEMPLATE_PATH):
            raise HTTPException(status_code=404, detail="Template not found.")
            
        with open(TEMPLATE_PATH, "rb") as f:
            template_bytes = f.read()
            
        doc = fitz.open("pdf", template_bytes)
        page = doc[0]
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Metadata (Top Right)
        meta_x = 350
        page.insert_text((meta_x, 50), f"Organization ID: {org_id}", fontsize=9, color=(0.1, 0.1, 0.4), fontname="Helvetica-Bold")
        page.insert_text((meta_x, 65), f"Generated On: {now}", fontsize=8, color=(0.3, 0.3, 0.3))

        # KPIs (Y=180)
        ky = 180
        kpis = [
            ("Security Score", f"{security_score}%"), 
            ("Total Endpoints", str(stats["total_endpoints"])), 
            ("Active Incidents", str(stats["active_incidents"])), 
            ("Critical Alerts", str(stats["critical_alerts"]))
        ]
        for i, (label, val) in enumerate(kpis):
            x = 60 + (i * 125)
            page.insert_text((x, ky), label, fontsize=8, color=(0.4, 0.4, 0.4))
            page.insert_text((x, ky + 18), val, fontsize=14, color=(0.1, 0.1, 0.3), fontname="Helvetica-Bold")
            
        # Donuts (Side-by-Side)
        sev_data = {k: v for k, v in stats["severity_map"].items() if v > 0}
        sev_buf = generate_donut_chart(sev_data, "Severity Distribution", ['#db2777', '#7c3aed', '#94a3b8', '#334155'])
        page.insert_image(fitz.Rect(50, 230, 280, 410), stream=sev_buf.read())
        
        health_data = {"Online": stats["online_endpoints"], "Offline": stats["offline_endpoints"]}
        health_buf = generate_donut_chart(health_data, "Agent Health", ['#10b981', '#ef4444'])
        page.insert_image(fitz.Rect(320, 230, 550, 410), stream=health_buf.read())

        # MITRE Bar Chart
        mitre_data = dict(sorted(stats["mitre_map"].items(), key=lambda x: x[1], reverse=True)[:6])
        if not mitre_data:
            mitre_data = {"No Data": 0}
        mitre_buf = generate_bar_chart(mitre_data, "MITRE ATT&CK® Tactic Coverage", "#7c3aed")
        page.insert_image(fitz.Rect(60, 420, 540, 600), stream=mitre_buf.read())
        
        # High Risk Assets (Bottom 3)
        hy = 640
        page.insert_text((60, hy), "High-Risk Endpoint Activity (Top 3)", fontsize=11, color=(0.1, 0.1, 0.3), fontname="Helvetica-Bold")
        top_targets = sorted(stats["target_heatmap"].items(), key=lambda x: x[1], reverse=True)[:3]
        for idx, (host, count) in enumerate(top_targets):
            curr_y = hy + 30 + (idx * 22)
            page.insert_text((60, curr_y), f"Endpoint: {host}", fontsize=9)
            page.insert_text((420, curr_y), f"Alert Frequency: {count} events", fontsize=9, color=(0.6, 0.1, 0.1))

        page.insert_text((240, 780), "Security Posture Tactical Summary - TechzazEDR", fontsize=8, color=(0.6, 0.6, 0.6))

        # Finalize
        out_buf = io.BytesIO()
        doc.save(out_buf)
        final_bytes = out_buf.getvalue()
        doc.close()
        out_buf.close()
        
        return Response(
            content=final_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=Security_Posture_Report_{org_id}.pdf"}
        )
    except Exception as e:
        print(f"REPORTS CRITICAL ERROR: {str(e)}")
        traceback.print_exc()
        return Response(content=f"Error: {str(e)}", status_code=500)

    except Exception as e:
        print(f"REPORTS CRITICAL ERROR: {str(e)}")
        traceback.print_exc()
        return Response(content=f"Error: {str(e)}", status_code=500)

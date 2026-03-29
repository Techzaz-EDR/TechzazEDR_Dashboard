import os
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor

def create_template():
    # Final path
    target_path = os.path.join(os.getcwd(), "app", "reports", "Security_Posture_Report_template.pdf")
    logo_path = os.path.abspath(os.path.join(os.getcwd(), "..", "frontend", "public", "assets", "Logo.png"))
    
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    
    # Create the canvas
    c = canvas.Canvas(target_path, pagesize=A4)
    width, height = A4
    
    # Header Blue bar
    c.setFillColor(HexColor("#1e1b4b")) # Midnight Blue
    c.rect(0, height - 100, width, 100, fill=1)
    
    # Techzaz EDR Title
    c.setFillColor(HexColor("#ffffff"))
    c.setFont("Helvetica-Bold", 24)
    c.drawString(160, height - 60, "Techzaz EDR")
    c.setFont("Helvetica", 14)
    c.drawString(160, height - 80, "Security Posture Report")
    
    # Insert Logo if it exists
    if os.path.exists(logo_path):
        try:
            c.drawImage(logo_path, 50, height - 90, width=90, height=80, preserveAspectRatio=True, mask='auto')
        except:
            pass
            
    # Decorative line
    c.setStrokeColor(HexColor("#4338ca"))
    c.setLineWidth(2)
    c.line(0, height - 101, width, height - 101)
    
    # Main Background Shell (Watermark effect)
    # We'll just use a subtle grey circle for now as a shape
    c.setStrokeColor(HexColor("#f1f5f9"))
    c.setLineWidth(1)
    c.circle(width/2, height/2, 200)
    
    # Footer line
    c.setStrokeColor(HexColor("#1e1b4b"))
    c.setLineWidth(1)
    c.line(0, 40, width, 40)
    
    # Finalize
    c.showPage()
    c.save()
    print(f"Template created successfully with reportlab at {target_path}")

if __name__ == "__main__":
    create_template()

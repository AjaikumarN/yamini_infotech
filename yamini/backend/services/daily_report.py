import matplotlib
matplotlib.use('Agg')  # Non-GUI backend for server
import matplotlib.pyplot as plt
import numpy as np
from datetime import date, datetime
from sqlalchemy import text
from services.brevo_email import BrevoEmailService
import os
import tempfile


def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points in kilometers (Haversine formula)"""
    from math import radians, sin, cos, sqrt, atan2
    
    R = 6371  # Earth radius in km
    
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    
    return R * c


async def get_completed_visits(db, salesman_id: int, date_filter):
    """Get all completed visits for a salesman on a specific date"""
    try:
        result = db.execute(text("""
            SELECT id, customer_name, notes, 
                   check_in_time, check_out_time,
                   check_in_latitude, check_in_longitude,
                   check_out_latitude, check_out_longitude
            FROM salesman_visits
            WHERE user_id = :salesman_id 
            AND DATE(check_in_time) = :date_filter
            AND check_out_time IS NOT NULL
            ORDER BY check_in_time ASC
        """), {"salesman_id": salesman_id, "date_filter": date_filter})
        
        visits = []
        for row in result:
            visits.append({
                "id": row[0],
                "customername": row[1],
                "notes": row[2],
                "checkintime": row[3],
                "checkouttime": row[4],
                "checkin_latitude": row[5],
                "checkin_longitude": row[6],
                "checkout_latitude": row[7],
                "checkout_longitude": row[8]
            })
        
        return visits
    except Exception as e:
        print(f"Get visits error: {e}")
        return []


def create_route_png(visits, salesman_name):
    """Generate route map PNG with visit markers"""
    if not visits or len(visits) == 0:
        return None
    
    try:
        fig, ax = plt.subplots(figsize=(12, 8))
        
        # Extract coordinates
        lats = [v["checkin_latitude"] for v in visits if v["checkin_latitude"]]
        lons = [v["checkin_longitude"] for v in visits if v["checkin_longitude"]]
        
        if not lats or not lons:
            plt.close()
            return None
        
        # Plot route line
        ax.plot(lons, lats, 'b-', linewidth=3, label='Route', alpha=0.6)
        
        # Plot visit markers
        for i, visit in enumerate(visits):
            if visit["checkin_latitude"] and visit["checkin_longitude"]:
                ax.scatter(visit["checkin_longitude"], visit["checkin_latitude"], 
                          c='red', s=200, marker='^', zorder=5, edgecolors='darkred', linewidths=2)
                
                # Add customer name annotation
                customer_name = visit["customername"][:15] if visit["customername"] else f"Visit {i+1}"
                ax.annotate(f"{i+1}. {customer_name}", 
                           (visit["checkin_longitude"], visit["checkin_latitude"]),
                           xytext=(8, 8), textcoords='offset points',
                           fontsize=9, bbox=dict(boxstyle='round,pad=0.3', facecolor='yellow', alpha=0.7))
        
        # Calculate total distance
        total_distance = 0
        for i in range(len(visits) - 1):
            if all([visits[i]["checkin_latitude"], visits[i]["checkin_longitude"],
                   visits[i+1]["checkin_latitude"], visits[i+1]["checkin_longitude"]]):
                dist = calculate_distance(
                    visits[i]["checkin_latitude"], visits[i]["checkin_longitude"],
                    visits[i+1]["checkin_latitude"], visits[i+1]["checkin_longitude"]
                )
                total_distance += dist
        
        # Chart styling
        ax.set_title(f'📍 {salesman_name} - Daily Route ({date.today()})\n'
                    f'Total Visits: {len(visits)} | Distance: {total_distance:.2f} km',
                    fontsize=14, fontweight='bold')
        ax.set_xlabel('Longitude', fontsize=11)
        ax.set_ylabel('Latitude', fontsize=11)
        ax.legend(fontsize=10)
        ax.grid(True, alpha=0.3, linestyle='--')
        
        # Save to temporary file
        temp_dir = tempfile.gettempdir()
        png_path = os.path.join(temp_dir, f"{salesman_name.replace(' ', '_')}_{len(visits)}visits_{date.today()}.png")
        plt.savefig(png_path, dpi=150, bbox_inches='tight', facecolor='white')
        plt.close()
        
        print(f"✅ PNG created: {png_path}")
        return png_path
        
    except Exception as e:
        print(f"PNG creation error: {e}")
        plt.close()
        return None


def create_html_template(visits, salesman_name, png_path):
    """Generate HTML email template"""
    
    visit_rows = ""
    for i, visit in enumerate(visits, 1):
        checkin = visit["checkintime"].strftime("%I:%M %p") if visit["checkintime"] else "N/A"
        checkout = visit["checkouttime"].strftime("%I:%M %p") if visit["checkouttime"] else "N/A"
        duration = ""
        if visit["checkintime"] and visit["checkouttime"]:
            delta = visit["checkouttime"] - visit["checkintime"]
            duration = f"{delta.seconds // 60} min"
        
        visit_rows += f"""
        <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">{i}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">{visit["customername"] or "N/A"}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">{checkin}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">{checkout}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">{duration}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">{visit["notes"] or "-"}</td>
        </tr>
        """
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }}
            .container {{ max-width: 900px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
            h1 {{ color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }}
            table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
            th {{ background-color: #3498db; color: white; padding: 12px; text-align: left; }}
            .summary {{ background: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0; }}
            .map-container {{ text-align: center; margin: 20px 0; }}
            img {{ max-width: 100%; height: auto; border: 2px solid #ddd; border-radius: 5px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>📍 Daily Route Report - {salesman_name}</h1>
            
            <div class="summary">
                <strong>Date:</strong> {date.today().strftime("%B %d, %Y")}<br>
                <strong>Total Visits:</strong> {len(visits)}<br>
                <strong>Salesman:</strong> {salesman_name}
            </div>
            
            <h2>Visit Details</h2>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Customer</th>
                        <th>Check-In</th>
                        <th>Check-Out</th>
                        <th>Duration</th>
                        <th>Notes</th>
                    </tr>
                </thead>
                <tbody>
                    {visit_rows}
                </tbody>
            </table>
            
            <div class="map-container">
                <h2>Route Map</h2>
                <img src="cid:route_map" alt="Route Map">
            </div>
            
            <p style="color: #7f8c8d; font-size: 12px; margin-top: 30px; text-align: center;">
                Generated automatically by Yamini Infotech ERP System
            </p>
        </div>
    </body>
    </html>
    """
    
    return html


async def generate_daily_report(db):
    """Main function to generate and send daily reports for all salesmen"""
    today = date.today()
    
    try:
        # Get all salesmen who completed visits today
        result = db.execute(text("""
            SELECT DISTINCT u.id, u.full_name
            FROM users u
            JOIN salesman_visits sv ON u.id = sv.user_id
            WHERE DATE(sv.check_in_time) = :today 
            AND sv.check_out_time IS NOT NULL
            AND u.role = 'SALESMAN'
        """), {"today": today})
        
        salesmen = result.fetchall()
        reports = []
        email_service = BrevoEmailService()
        
        for salesman_id, salesman_name in salesmen:
            visits = await get_completed_visits(db, salesman_id, today)
            
            if len(visits) > 0:
                # Generate map
                png_path = create_route_png(visits, salesman_name)
                
                # Generate HTML
                html = create_html_template(visits, salesman_name, png_path)
                
                # Send email
                try:
                    email_service.send_report(
                        f"📍 Daily Route Report - {salesman_name} - {today}",
                        html,
                        png_path
                    )
                    
                    reports.append({
                        "salesman_name": salesman_name,
                        "visits": len(visits),
                        "status": "sent"
                    })
                except Exception as e:
                    print(f"Email error for {salesman_name}: {e}")
                    reports.append({
                        "salesman_name": salesman_name,
                        "visits": len(visits),
                        "status": f"failed: {str(e)}"
                    })
                
                # Cleanup PNG
                if png_path and os.path.exists(png_path):
                    try:
                        os.unlink(png_path)
                        print(f"🗑️ Cleaned up: {png_path}")
                    except Exception as e:
                        print(f"Cleanup error: {e}")
        
        return {
            "date": str(today),
            "reports_sent": len([r for r in reports if r["status"] == "sent"]),
            "results": reports
        }
        
    except Exception as e:
        print(f"Daily report generation error: {e}")
        return {
            "date": str(today),
            "reports_sent": 0,
            "error": str(e)
        }

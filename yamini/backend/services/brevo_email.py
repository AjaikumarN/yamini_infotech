import smtplib
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from pathlib import Path


class BrevoEmailService:
    """Email service for sending daily reports via Brevo SMTP"""
    
    def __init__(self):
        self.username = os.getenv("BREVO_SMTP_USERNAME")
        self.password = os.getenv("BREVO_SMTP_PASSWORD")
        self.admin_email = os.getenv("ADMIN_EMAIL")
        self.smtp_server = "smtp-relay.brevo.com"
        self.smtp_port = 587
        
        if not all([self.username, self.password, self.admin_email]):
            raise ValueError("Missing Brevo credentials in .env file")
    
    def send_report(self, subject: str, html_content: str, png_path: str = None):
        """
        Send email report with optional PNG attachment
        
        Args:
            subject: Email subject line
            html_content: HTML formatted email body
            png_path: Optional path to PNG image to embed
            
        Returns:
            True if successful
        """
        try:
            msg = MIMEMultipart('mixed')
            msg['Subject'] = subject
            msg['From'] = self.username
            msg['To'] = self.admin_email
            
            # Attach HTML content
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            # Attach PNG if provided
            if png_path and Path(png_path).exists():
                with open(png_path, 'rb') as f:
                    img = MIMEImage(f.read())
                    img.add_header('Content-ID', '<route_map>')
                    img.add_header('Content-Disposition', 'inline', filename=Path(png_path).name)
                    msg.attach(img)
            
            # Send via SMTP
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.username, self.password)
                server.send_message(msg)
            
            print(f"✅ Email sent: {subject}")
            return True
            
        except Exception as e:
            print(f"❌ Email failed: {str(e)}")
            raise

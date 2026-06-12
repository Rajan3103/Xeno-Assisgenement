import smtplib
from email.mime.text import MIMEText
from app.core.config import settings

def send_email(to_email: str, subject: str, body: str) -> bool:
    # Output mock details for testing/debugging
    print(f"[EmailService] Sending email to {to_email} with subject: '{subject}'")
    
    # Example production integration:
    # msg = MIMEText(body)
    # msg['Subject'] = subject
    # msg['From'] = settings.SMTP_FROM_EMAIL
    # msg['To'] = to_email
    # try:
    #     with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
    #         server.starttls()
    #         server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
    #         server.send_message(msg)
    #     return True
    # except Exception as e:
    #     print(f"Failed to send email: {e}")
    #     return False
    
    return True

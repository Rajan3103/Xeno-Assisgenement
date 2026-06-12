import httpx
from app.core.config import settings

def send_sms(to_phone: str, message: str) -> bool:
    print(f"[SMSService] Sending SMS to {to_phone}: '{message}'")
    
    # Example production integration using Twilio API directly:
    # url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json"
    # data = {
    #     "To": to_phone,
    #     "From": settings.TWILIO_PHONE_NUMBER,
    #     "Body": message
    # }
    # auth = (settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    # try:
    #     response = httpx.post(url, data=data, auth=auth)
    #     return response.status_code == 201
    # except Exception as e:
    #     print(f"Failed to send SMS: {e}")
    #     return False
    
    return True

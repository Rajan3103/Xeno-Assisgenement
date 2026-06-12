import httpx
from app.core.config import settings

def send_whatsapp(to_phone: str, message: str) -> bool:
    formatted_to = to_phone if to_phone.startswith("whatsapp:") else f"whatsapp:{to_phone}"
    formatted_from = settings.TWILIO_WHATSAPP_NUMBER if settings.TWILIO_WHATSAPP_NUMBER.startswith("whatsapp:") else f"whatsapp:{settings.TWILIO_WHATSAPP_NUMBER}"
    
    print(f"[WhatsAppService] Sending WhatsApp to {formatted_to}: '{message}'")
    
    # Example production integration using Twilio:
    # url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json"
    # data = {
    #     "To": formatted_to,
    #     "From": formatted_from,
    #     "Body": message
    # }
    # auth = (settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    # try:
    #     response = httpx.post(url, data=data, auth=auth)
    #     return response.status_code == 201
    # except Exception as e:
    #     print(f"Failed to send WhatsApp: {e}")
    #     return False
    
    return True

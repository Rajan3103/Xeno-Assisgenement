from pydantic import BaseModel

class CommunicationCallback(BaseModel):
    customer_id: str
    campaign_id: int
    type: str  # Email, SMS, WhatsApp
    status: str  # Delivered, Failed, Opened, Read, Clicked

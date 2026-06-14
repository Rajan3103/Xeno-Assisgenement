from pydantic import BaseModel, field_validator

class CommunicationCallback(BaseModel):
    customer_id: str
    campaign_id: int
    type: str  # Email, SMS, WhatsApp
    status: str  # Delivered, Failed, Opened, Read, Clicked

    @field_validator('customer_id', mode='before')
    @classmethod
    def coerce_customer_id(cls, v):
        if v is not None:
            return str(v)
        return v

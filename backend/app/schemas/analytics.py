from pydantic import BaseModel

class SystemAnalytics(BaseModel):
    sent: int
    delivered: int
    failed: int
    opened: int
    read: int
    clicked: int
    conversion_rate: float
    engagement_rate: float

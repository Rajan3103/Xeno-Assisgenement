from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class CampaignBase(BaseModel):
    name: str
    segment: str
    message: str
    channel: str
    status: Optional[str] = "Draft"

class CampaignCreate(CampaignBase):
    pass

class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    segment: Optional[str] = None
    message: Optional[str] = None
    channel: Optional[str] = None
    status: Optional[str] = None

class CampaignInDBBase(CampaignBase):
    id: int
    created_at: datetime
    total_recipients: Optional[int] = 0
    sent_count: Optional[int] = 0
    delivered_count: Optional[int] = 0
    opened_count: Optional[int] = 0
    clicked_count: Optional[int] = 0
    failed_count: Optional[int] = 0
    revenue_attributed: Optional[float] = 0.0
    started_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Campaign(CampaignInDBBase):
    pass

class CampaignAnalytics(BaseModel):
    total_sent: int
    delivered: int
    failed: int
    opened: int
    read: int
    clicked: int
    delivery_rate: float
    open_rate: float
    click_rate: float

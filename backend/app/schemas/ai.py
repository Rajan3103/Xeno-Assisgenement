from pydantic import BaseModel
from typing import List
from app.schemas.customer import Customer

class PromptPayload(BaseModel):
    prompt: str

class AISegmentResponse(BaseModel):
    sql_filter: str
    audience_count: int
    sample_customers: List[Customer]

class AIDraftRequest(BaseModel):
    audience_profile: str

class AIDraftResponse(BaseModel):
    campaign_title: str
    campaign_message: str
    cta: str

class AIInsightsRequest(BaseModel):
    campaign_id: int

class AIInsightsResponse(BaseModel):
    summary: str
    recommendations: List[str]
    audience_insights: str
    next_best_action: str

class AIMarketingCommandRequest(BaseModel):
    prompt: str

class AIMarketingCommandResponse(BaseModel):
    segment_name: str
    sql_filter: str
    campaign_name: str
    channel: str
    campaign_message: str
    cta: str
    audience_count: int



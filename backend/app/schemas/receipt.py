from pydantic import BaseModel
from typing import Optional

class ReceiptCreate(BaseModel):
    communication_id: str
    status: str
    receipt_id: Optional[str] = None
    retry_count: Optional[int] = 0
    details: Optional[str] = None

class ReceiptResponse(BaseModel):
    status: str
    message: str
    event_id: int
    communication_id: str
    new_status: str

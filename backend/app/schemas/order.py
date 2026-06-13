from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class OrderBase(BaseModel):
    customer_id: str
    amount: float
    product_name: str
    category: str
    campaign_id: Optional[int] = None
    status: Optional[str] = "completed"

class OrderCreate(OrderBase):
    id: Optional[str] = None

class OrderUpdate(BaseModel):
    customer_id: Optional[str] = None
    amount: Optional[float] = None
    product_name: Optional[str] = None
    category: Optional[str] = None
    campaign_id: Optional[int] = None
    status: Optional[str] = None

class OrderInDBBase(OrderBase):
    id: str
    order_date: datetime

    class Config:
        from_attributes = True

class Order(OrderInDBBase):
    pass

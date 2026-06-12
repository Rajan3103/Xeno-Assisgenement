from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class OrderBase(BaseModel):
    customer_id: int
    total_amount: float
    status: Optional[str] = "Pending"

class OrderCreate(OrderBase):
    pass

class OrderUpdate(BaseModel):
    customer_id: Optional[int] = None
    total_amount: Optional[float] = None
    status: Optional[str] = None

class OrderInDBBase(OrderBase):
    id: int
    order_date: datetime

    class Config:
        from_attributes = True

class Order(OrderInDBBase):
    pass

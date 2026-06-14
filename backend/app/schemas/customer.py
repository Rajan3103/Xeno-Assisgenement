from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime

class CustomerBase(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    company: Optional[str] = None
    status: Optional[str] = "Lead"
    city: Optional[str] = None
    state: Optional[str] = None
    total_spent: Optional[float] = 0.0
    order_count: Optional[int] = 0
    avg_order_value: Optional[float] = 0.0
    last_order_date: Optional[str] = None
    first_order_date: Optional[str] = None
    rfm_recency: Optional[int] = None
    rfm_frequency: Optional[int] = None
    rfm_monetary: Optional[int] = None
    tags: Optional[str] = None

class CustomerCreate(CustomerBase):
    id: Optional[str] = None

    @field_validator('id', mode='before')
    @classmethod
    def coerce_id(cls, v):
        if v is not None:
            return str(v)
        return v

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    status: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    total_spent: Optional[float] = None
    order_count: Optional[int] = None
    avg_order_value: Optional[float] = None
    last_order_date: Optional[str] = None
    first_order_date: Optional[str] = None
    rfm_recency: Optional[int] = None
    rfm_frequency: Optional[int] = None
    rfm_monetary: Optional[int] = None
    tags: Optional[str] = None

class CustomerInDBBase(CustomerBase):
    id: str
    created_at: datetime
    owner_id: Optional[int] = None

    @field_validator('id', mode='before')
    @classmethod
    def coerce_id(cls, v):
        if v is not None:
            return str(v)
        return v

    class Config:
        from_attributes = True

class Customer(CustomerInDBBase):
    pass

from pydantic import BaseModel, model_validator, field_validator
from datetime import datetime
from typing import Optional, Any

class OrderBase(BaseModel):
    customer_id: str
    amount: float
    product_name: str
    category: str
    campaign_id: Optional[int] = None
    status: Optional[str] = "completed"

    @field_validator('customer_id', mode='before')
    @classmethod
    def coerce_customer_id(cls, v):
        if v is not None:
            return str(v)
        return v

    @model_validator(mode="before")
    @classmethod
    def map_total_amount(cls, data: Any) -> Any:
        if isinstance(data, dict) and "total_amount" in data and "amount" not in data:
            data["amount"] = data.get("total_amount")
        return data

class OrderCreate(OrderBase):
    id: Optional[str] = None

    @field_validator('id', mode='before')
    @classmethod
    def coerce_id(cls, v):
        if v is not None:
            return str(v)
        return v

class OrderUpdate(BaseModel):
    customer_id: Optional[str] = None
    amount: Optional[float] = None
    product_name: Optional[str] = None
    category: Optional[str] = None
    campaign_id: Optional[int] = None
    status: Optional[str] = None

    @field_validator('customer_id', mode='before')
    @classmethod
    def coerce_customer_id(cls, v):
        if v is not None:
            return str(v)
        return v

class OrderInDBBase(OrderBase):
    id: str
    order_date: datetime

    @field_validator('id', mode='before')
    @classmethod
    def coerce_id(cls, v):
        if v is not None:
            return str(v)
        return v

    class Config:
        from_attributes = True

class Order(OrderInDBBase):
    pass

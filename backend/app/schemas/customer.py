from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CustomerBase(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    company: Optional[str] = None
    status: Optional[str] = "Lead"

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    status: Optional[str] = None

class CustomerInDBBase(CustomerBase):
    id: int
    created_at: datetime
    owner_id: int

    class Config:
        from_attributes = True

class Customer(CustomerInDBBase):
    pass

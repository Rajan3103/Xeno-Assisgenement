from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class ProductBase(BaseModel):
    name: str
    category: str
    price: float
    is_active: int = 1

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

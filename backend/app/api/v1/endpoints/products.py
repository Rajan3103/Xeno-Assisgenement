from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas import product as schema_product
from app.crud import product as crud_product

router = APIRouter()

@router.get("/", response_model=List[schema_product.Product])
def read_products(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    products = crud_product.get_products(db, skip=skip, limit=limit)
    return products

@router.post("/", response_model=schema_product.Product)
def create_product(
    *,
    db: Session = Depends(get_db),
    product_in: schema_product.ProductCreate,
) -> Any:
    return crud_product.create_product(db=db, product=product_in)

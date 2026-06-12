from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud import customer as crud_customer
from app.schemas import order as schema_order
from app.schemas import auth as schema_auth
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()

@router.post("/", response_model=schema_order.Order, status_code=status.HTTP_201_CREATED)
def create_order(
    *,
    db: Session = Depends(get_db),
    order_in: schema_order.OrderCreate,
    current_user: schema_auth.User = Depends(get_current_user),
) -> Any:
    # Verify the customer exists
    customer = crud_customer.get_customer(db, customer_id=order_in.customer_id)
    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )
    order = crud_customer.create_order(db, order=order_in)
    return order

@router.get("/", response_model=List[schema_order.Order])
def read_orders(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    customer_id: Optional[int] = None,
    status: Optional[str] = None,
    current_user: schema_auth.User = Depends(get_current_user),
) -> Any:
    orders = crud_customer.get_orders_by_owner(
        db,
        owner_id=current_user.id,
        skip=skip,
        limit=limit,
        customer_id=customer_id,
        status=status
    )
    return orders

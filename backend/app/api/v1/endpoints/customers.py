from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud import customer as crud_customer
from app.schemas import customer as schema_customer
from app.schemas import auth as schema_auth
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()

@router.post("/", response_model=schema_customer.Customer, status_code=status.HTTP_201_CREATED)
def create_customer(
    *,
    db: Session = Depends(get_db),
    customer_in: schema_customer.CustomerCreate,
    current_user: schema_auth.User = Depends(get_current_user),
) -> Any:
    customer = crud_customer.create_customer(db, customer=customer_in, owner_id=current_user.id)
    return customer

@router.get("/", response_model=List[schema_customer.Customer])
def read_customers(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: schema_auth.User = Depends(get_current_user),
) -> Any:
    customers = crud_customer.get_customers_by_owner(
        db,
        owner_id=current_user.id,
        skip=skip,
        limit=limit,
        status=status,
        search=search
    )
    return customers

@router.get("/{id}", response_model=schema_customer.Customer)
def read_customer(
    *,
    db: Session = Depends(get_db),
    id: int,
    current_user: schema_auth.User = Depends(get_current_user),
) -> Any:
    customer = crud_customer.get_customer(db, customer_id=id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    if customer.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return customer

@router.put("/{id}", response_model=schema_customer.Customer)
def update_customer(
    *,
    db: Session = Depends(get_db),
    id: int,
    customer_in: schema_customer.CustomerUpdate,
    current_user: schema_auth.User = Depends(get_current_user),
) -> Any:
    customer = crud_customer.get_customer(db, customer_id=id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    if customer.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    customer = crud_customer.update_customer(db, customer_id=id, customer=customer_in)
    return customer

@router.delete("/{id}", response_model=schema_customer.Customer)
def delete_customer(
    *,
    db: Session = Depends(get_db),
    id: int,
    current_user: schema_auth.User = Depends(get_current_user),
) -> Any:
    customer = crud_customer.get_customer(db, customer_id=id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    if customer.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    customer = crud_customer.delete_customer(db, customer_id=id)
    return customer

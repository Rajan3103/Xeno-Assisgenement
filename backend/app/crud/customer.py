import uuid
from sqlalchemy.orm import Session
from app.models.models import Customer, User, Order, Campaign
from app.schemas.customer import CustomerCreate, CustomerUpdate
from app.schemas.auth import UserCreate
from app.schemas.order import OrderCreate
from app.schemas.campaign import CampaignCreate
from app.core.security import get_password_hash

# User CRUD operations
def get_user(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user: UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        role=user.role or "MarketingManager",
        is_active=1 if user.is_active else 0
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Customer CRUD operations
def get_customer(db: Session, customer_id: str):
    return db.query(Customer).filter(Customer.id == customer_id).first()

def get_customers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Customer).offset(skip).limit(limit).all()

def get_customers_by_owner(
    db: Session,
    owner_id: int,
    skip: int = 0,
    limit: int = 100,
    status: str = None,
    search: str = None
):
    query = db.query(Customer)
    if status:
        query = query.filter(Customer.status == status)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Customer.name.ilike(search_filter)) |
            (Customer.email.ilike(search_filter)) |
            (Customer.company.ilike(search_filter))
        )
    return query.offset(skip).limit(limit).all()

def create_customer(db: Session, customer: CustomerCreate, owner_id: int):
    db_customer = Customer(**customer.model_dump(exclude={"id"}), owner_id=owner_id)
    if customer.id:
        db_customer.id = customer.id
    else:
        db_customer.id = f"cust_{uuid.uuid4().hex[:9]}"
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

# Order CRUD operations
def get_orders_by_owner(
    db: Session,
    owner_id: int,
    skip: int = 0,
    limit: int = 100,
    customer_id: str = None,
    status: str = None
):
    query = db.query(Order).join(Customer)
    if customer_id:
        query = query.filter(Order.customer_id == customer_id)
    if status:
        query = query.filter(Order.status == status)
    return query.offset(skip).limit(limit).all()

def create_order(db: Session, order: OrderCreate):
    db_order = Order(**order.model_dump(exclude={"id"}))
    if order.id:
        db_order.id = order.id
    else:
        db_order.id = f"ord_{uuid.uuid4().hex[:9]}"
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order

def update_customer(db: Session, customer_id: str, customer: CustomerUpdate):
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not db_customer:
        return None
    
    update_data = customer.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_customer, key, value)
        
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

def delete_customer(db: Session, customer_id: str):
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not db_customer:
        return None
    db.delete(db_customer)
    db.commit()
    return db_customer

# Campaign CRUD operations
def get_campaign(db: Session, campaign_id: int):
    return db.query(Campaign).filter(Campaign.id == campaign_id).first()

def get_campaigns(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Campaign).offset(skip).limit(limit).all()

def create_campaign(db: Session, campaign: CampaignCreate):
    db_campaign = Campaign(**campaign.model_dump())
    db.add(db_campaign)
    db.commit()
    db.refresh(db_campaign)
    return db_campaign

from sqlalchemy import Table, Column, Integer, String, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

# Many-to-Many association table between Customer and Segment
customer_segment_association = Table(
    "customer_segment_association",
    Base.metadata,
    Column("customer_id", Integer, ForeignKey("customers.id", ondelete="CASCADE"), primary_key=True),
    Column("segment_id", Integer, ForeignKey("segments.id", ondelete="CASCADE"), primary_key=True)
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, index=True)
    is_active = Column(Integer, default=1)

    # Relationships
    customers = relationship("Customer", back_populates="owner", cascade="all, delete-orphan")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    email = Column(String, index=True, nullable=False)
    phone = Column(String, index=True)
    company = Column(String, index=True)
    status = Column(String, index=True, default="Lead")  # Lead, Contacted, Customer, etc.
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    owner = relationship("User", back_populates="customers")
    orders = relationship("Order", back_populates="customer", cascade="all, delete-orphan")
    communications = relationship("Communication", back_populates="customer", cascade="all, delete-orphan")
    segments = relationship(
        "Segment",
        secondary=customer_segment_association,
        back_populates="customers"
    )

    __table_args__ = (
        Index("idx_customer_email_owner", "email", "owner_id"),
    )


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    order_date = Column(DateTime, default=datetime.utcnow, index=True)
    total_amount = Column(Float, nullable=False)
    status = Column(String, index=True, default="Pending")  # Pending, Completed, Shipped, Cancelled

    # Relationships
    customer = relationship("Customer", back_populates="orders")


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    segment = Column(String, nullable=False)
    message = Column(String, nullable=False)
    channel = Column(String, index=True, nullable=False)  # Email, SMS, WhatsApp
    status = Column(String, index=True, default="Draft")  # Draft, Active, Completed, Cancelled
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    communications = relationship("Communication", back_populates="campaign", cascade="all, delete-orphan")


class Communication(Base):
    __tablename__ = "communications"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String, index=True, nullable=False)  # Email, SMS, WhatsApp
    status = Column(String, index=True, default="Sent")  # Sent, Delivered, Failed, Bounced
    sent_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    customer = relationship("Customer", back_populates="communications")
    campaign = relationship("Campaign", back_populates="communications")
    events = relationship("CommunicationEvent", back_populates="communication", cascade="all, delete-orphan")


class CommunicationEvent(Base):
    __tablename__ = "communication_events"

    id = Column(Integer, primary_key=True, index=True)
    communication_id = Column(Integer, ForeignKey("communications.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String, index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    receipt_id = Column(String, unique=True, index=True, nullable=True) # For idempotency/deduplication
    retry_count = Column(Integer, default=0) # Tracks client-side retry attempts
    details = Column(String, nullable=True) # JSON or descriptive text details

    # Relationships
    communication = relationship("Communication", back_populates="events")



class Segment(Base):
    __tablename__ = "segments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    customers = relationship(
        "Customer",
        secondary=customer_segment_association,
        back_populates="segments"
    )

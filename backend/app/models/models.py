from sqlalchemy import Table, Column, Integer, String, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

# Many-to-Many association table between Customer and Segment
customer_segment_association = Table(
    "customer_segment_association",
    Base.metadata,
    Column("customer_id", String, ForeignKey("customers.id", ondelete="CASCADE"), primary_key=True),
    Column("segment_id", Integer, ForeignKey("segments.id", ondelete="CASCADE"), primary_key=True)
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, index=True)
    role = Column(String, default="MarketingManager", nullable=False)
    is_active = Column(Integer, default=1)

    # Relationships
    customers = relationship("Customer", back_populates="owner", cascade="all, delete-orphan")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    email = Column(String, index=True, nullable=False)
    phone = Column(String, index=True, nullable=True)
    company = Column(String, index=True, nullable=True)  # Fashion interest profile
    status = Column(String, index=True, default="Lead")  # Lead, Contacted, Customer, Inactive
    
    # Denormalized fields matching XenoFlow
    city = Column(String, index=True, nullable=True)
    state = Column(String, index=True, nullable=True)
    total_spent = Column(Float, default=0.0, nullable=False)
    order_count = Column(Integer, default=0, nullable=False)
    avg_order_value = Column(Float, default=0.0, nullable=False)
    last_order_date = Column(String, nullable=True)
    first_order_date = Column(String, nullable=True)
    rfm_recency = Column(Integer, nullable=True)
    rfm_frequency = Column(Integer, nullable=True)
    rfm_monetary = Column(Integer, nullable=True)
    tags = Column(String, nullable=True)  # Comma-separated tags
    signup_date = Column(DateTime, default=datetime.utcnow)
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

    id = Column(String, primary_key=True, index=True)
    customer_id = Column(String, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="SET NULL"), nullable=True, index=True)
    product_name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    order_date = Column(DateTime, default=datetime.utcnow, index=True)
    status = Column(String, index=True, default="completed")

    # Relationships
    customer = relationship("Customer", back_populates="orders")


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    segment_id = Column(Integer, ForeignKey("segments.id", ondelete="SET NULL"), nullable=True)
    segment = Column(String, nullable=False)  # Segment search/prompt string
    message = Column(String, nullable=False)  # message_template
    channel = Column(String, index=True, nullable=False)  # Email, SMS, WhatsApp
    status = Column(String, index=True, default="Draft")  # Draft, Active, Completed, Cancelled
    
    # XenoFlow campaign analytics columns
    total_recipients = Column(Integer, default=0, nullable=False)
    sent_count = Column(Integer, default=0, nullable=False)
    delivered_count = Column(Integer, default=0, nullable=False)
    opened_count = Column(Integer, default=0, nullable=False)
    clicked_count = Column(Integer, default=0, nullable=False)
    failed_count = Column(Integer, default=0, nullable=False)
    revenue_attributed = Column(Float, default=0.0, nullable=False)
    started_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    communications = relationship("Communication", back_populates="campaign", cascade="all, delete-orphan")


class Communication(Base):
    __tablename__ = "messages"  # Renamed to messages

    id = Column(String, primary_key=True, index=True)
    customer_id = Column(String, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    rendered_text = Column(String, nullable=True)
    channel = Column(String, nullable=True)
    status = Column(String, index=True, default="queued")  # queued, sent, delivered, opened, clicked, failed
    external_id = Column(String, index=True, nullable=True)
    failure_reason = Column(String, nullable=True)
    sent_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    opened_at = Column(DateTime, nullable=True)
    clicked_at = Column(DateTime, nullable=True)
    failed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    customer = relationship("Customer", back_populates="communications")
    campaign = relationship("Campaign", back_populates="communications")
    events = relationship("CommunicationEvent", back_populates="communication", cascade="all, delete-orphan")


class CommunicationEvent(Base):
    __tablename__ = "campaign_events"  # Renamed to campaign_events

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(String, ForeignKey("messages.id", ondelete="CASCADE"), nullable=False, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id = Column(String, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column("event_type", String, index=True, nullable=False)  # Map status attr to event_type column
    timestamp = Column("occurred_at", DateTime, default=datetime.utcnow, index=True)  # Map timestamp attr to occurred_at column
    receipt_id = Column(String, unique=True, index=True, nullable=True)  # For idempotency/deduplication
    retry_count = Column(Integer, default=0)
    details = Column(String, nullable=True)

    # Relationships
    communication = relationship("Communication", back_populates="events")


class Segment(Base):
    __tablename__ = "segments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)
    rules = Column(String, nullable=True)  # For rules list JSON
    computed_sql = Column(String, nullable=True)
    customer_count = Column(Integer, default=0, nullable=False)
    is_ai_generated = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    customers = relationship(
        "Customer",
        secondary=customer_segment_association,
        back_populates="segments"
    )


class ReceiptIdempotency(Base):
    __tablename__ = "receipt_idempotency"

    idempotency_key = Column(String, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

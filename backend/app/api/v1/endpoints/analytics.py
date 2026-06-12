from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any

from app.core.database import get_db
from app.models.models import Communication, Customer
from app.schemas.analytics import SystemAnalytics
from app.schemas import auth as schema_auth
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=SystemAnalytics)
@router.get("/analytics", response_model=SystemAnalytics)
def get_global_analytics(
    db: Session = Depends(get_db),
    current_user: schema_auth.User = Depends(get_current_user),
) -> Any:
    # Query all communications for customers owned by the current user
    comms = db.query(Communication).join(Customer).filter(
        Customer.owner_id == current_user.id
    ).all()
    
    sent = len(comms)
    delivered = 0
    failed = 0
    opened = 0
    read = 0
    clicked = 0
    
    for comm in comms:
        status_lower = comm.status.lower()
        if status_lower == "delivered":
            delivered += 1
        elif status_lower == "failed":
            failed += 1
        elif status_lower == "opened":
            opened += 1
        elif status_lower == "read":
            read += 1
        elif status_lower == "clicked":
            clicked += 1
            
    # Calculate conversion and engagement rates
    # Conversion rate: Clicked / Sent * 100
    # Engagement rate: (Opened + Read + Clicked) / Sent * 100
    conversion_rate = round((clicked / sent * 100), 2) if sent > 0 else 0.0
    engagement_rate = round(((opened + read + clicked) / sent * 100), 2) if sent > 0 else 0.0
    
    return SystemAnalytics(
        sent=sent,
        delivered=delivered,
        failed=failed,
        opened=opened,
        read=read,
        clicked=clicked,
        conversion_rate=conversion_rate,
        engagement_rate=engagement_rate
    )

from typing import Any, List
import httpx
import logging
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.database import get_db, SessionLocal
from app.core.config import settings
from app.crud import customer as crud_customer
from app.schemas import campaign as schema_campaign
from app.schemas import auth as schema_auth
from app.api.v1.endpoints.auth import get_current_user
from app.models.models import Communication, Campaign

router = APIRouter()
logger = logging.getLogger(__name__)

CHANNEL_SERVICE_URL = settings.CHANNEL_SERVICE_URL


def dispatch_campaign_messages(campaign_id: int, owner_id: int):
    db = SessionLocal()
    try:
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        if not campaign:
            logger.error(f"[CampaignDispatch] Campaign {campaign_id} not found.")
            return
            
        logger.info(f"[CampaignDispatch] Resolving segment for campaign: {campaign.name}")
        
        # 1. Translate campaign.segment into SQL filter
        sql_filter = None
        if settings.GEMINI_API_KEY:
            try:
                from app.api.v1.endpoints.ai import call_gemini_api
                sql_filter = call_gemini_api(campaign.segment)
            except Exception as e:
                logger.error(f"[CampaignDispatch] Gemini API failed, falling back: {e}")
                
        if not sql_filter:
            prompt_lower = campaign.segment.lower()
            if "spent" in prompt_lower or "5000" in prompt_lower:
                sql_filter = "id IN (SELECT customer_id FROM orders WHERE status = 'Completed' GROUP BY customer_id HAVING SUM(total_amount) > 62.5)"
            elif "inactive" in prompt_lower or "dormant" in prompt_lower:
                sql_filter = "status = 'Inactive'"
            elif "customer" in prompt_lower:
                sql_filter = "status = 'Customer'"
            else:
                sql_filter = "status = 'Lead'"
                
        # 2. Get target customers matching the filter (ignoring owner_id for shared cohort pool)
        raw_query = f"SELECT id, email, phone FROM customers WHERE ({sql_filter})"
        results = db.execute(text(raw_query)).fetchall()
        
        logger.info(f"[CampaignDispatch] Found {len(results)} target customers for segment: '{campaign.segment}'")
        
        # Parse message content if it was saved as JSON
        msg_body = campaign.message
        try:
            import json
            parsed_msg = json.loads(campaign.message)
            msg_body = parsed_msg.get("body", campaign.message)
        except Exception:
            pass

        # 3. Create communications and dispatch
        for row in results:
            existing = db.query(Communication).filter(
                Communication.customer_id == row.id,
                Communication.campaign_id == campaign.id
            ).first()
            if existing:
                continue
                
            import uuid
            db_comm = Communication(
                id=f"msg_{uuid.uuid4().hex[:9]}",
                customer_id=row.id,
                campaign_id=campaign.id,
                channel=campaign.channel,
                status="Sending"
            )
            db.add(db_comm)
            db.commit()
            db.refresh(db_comm)
            
            # Recipient email/phone
            recipient = row.email if campaign.channel.lower() == "email" else row.phone
            if not recipient:
                recipient = row.email or row.phone
                
            if not recipient:
                logger.warning(f"[CampaignDispatch] Customer {row.id} has no email or phone. Skipping.")
                continue
                
            payload = {
                "recipient": recipient,
                "message": msg_body,
                "channel": campaign.channel,
                "metadata": {
                    "customer_id": row.id,
                    "campaign_id": campaign.id,
                    "communication_id": db_comm.id
                }
            }
            
            try:
                response = httpx.post(CHANNEL_SERVICE_URL, json=payload, timeout=5.0)
                logger.info(f"[CampaignDispatch] Dispatched customer {row.id} via {campaign.channel}. Response: {response.status_code}")
            except Exception as e:
                logger.error(f"[CampaignDispatch] Failed to dispatch for customer {row.id}: {e}")
                db_comm.status = "Failed"
                db.add(db_comm)
                db.commit()
                
    except Exception as e:
        logger.error(f"[CampaignDispatch] Unexpected error during campaign dispatch: {e}")
    finally:
        db.close()

@router.post("/", response_model=schema_campaign.Campaign, status_code=status.HTTP_201_CREATED)
def create_campaign(
    *,
    db: Session = Depends(get_db),
    campaign_in: schema_campaign.CampaignCreate,
    background_tasks: BackgroundTasks,
    current_user: schema_auth.User = Depends(get_current_user),
) -> Any:
    campaign = crud_customer.create_campaign(db, campaign=campaign_in)
    
    if campaign.status == "Active":
        background_tasks.add_task(
            dispatch_campaign_messages,
            campaign.id,
            current_user.id
        )
        
    return campaign


@router.get("/", response_model=List[schema_campaign.Campaign])
def read_campaigns(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: schema_auth.User = Depends(get_current_user),
) -> Any:
    campaigns = crud_customer.get_campaigns(db, skip=skip, limit=limit)
    return campaigns


@router.post("/{campaign_id}/launch", response_model=schema_campaign.Campaign)
def launch_campaign(
    campaign_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: schema_auth.User = Depends(get_current_user),
) -> Any:
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )
    
    # Update campaign status to Active
    campaign.status = "Active"
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    
    # Trigger message dispatch background task
    background_tasks.add_task(
        dispatch_campaign_messages,
        campaign.id,
        current_user.id
    )
    
    return campaign


@router.get("/{campaign_id}/analytics", response_model=schema_campaign.CampaignAnalytics)
def get_campaign_analytics(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: schema_auth.User = Depends(get_current_user),
) -> Any:
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )
        
    # Get all communications for this campaign
    from app.models.models import Communication
    comms = db.query(Communication).filter(Communication.campaign_id == campaign_id).all()
    
    total_sent = len(comms)
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
            
    # Calculate rates
    # Delivery rate: successfully delivered (any status except Failed and Sending) / total_sent
    # Open rate: (Opened + Read + Clicked) / total_sent
    # Click rate: Clicked / total_sent
    successful_deliveries = total_sent - failed - sum(1 for c in comms if c.status.lower() == "sending")
    
    delivery_rate = round((successful_deliveries / total_sent * 100), 2) if total_sent > 0 else 0.0
    open_rate = round(((opened + read + clicked) / total_sent * 100), 2) if total_sent > 0 else 0.0
    click_rate = round((clicked / total_sent * 100), 2) if total_sent > 0 else 0.0
    
    return schema_campaign.CampaignAnalytics(
        total_sent=total_sent,
        delivered=delivered,
        failed=failed,
        opened=opened,
        read=read,
        clicked=clicked,
        delivery_rate=delivery_rate,
        open_rate=open_rate,
        click_rate=click_rate
    )


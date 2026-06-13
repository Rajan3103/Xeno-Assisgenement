import time
import random
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError

from app.core.database import get_db
from app.models.models import Communication, CommunicationEvent, ReceiptIdempotency
from app.schemas.receipt import ReceiptCreate, ReceiptResponse

router = APIRouter()
logger = logging.getLogger(__name__)

def update_communication_and_log_event(db: Session, payload: ReceiptCreate):
    # 1. Verify communication exists
    comm = db.query(Communication).filter(Communication.id == payload.communication_id).first()
    if not comm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Communication record with ID {payload.communication_id} not found"
        )

    # 2. Idempotency Check: if receipt_id is provided, check idempotency table
    if payload.receipt_id:
        existing_idemp = db.query(ReceiptIdempotency).filter(
            ReceiptIdempotency.idempotency_key == payload.receipt_id
        ).first()
        if existing_idemp:
            # Find the existing event to return its ID, or default to 1
            existing_event = db.query(CommunicationEvent).filter(
                CommunicationEvent.receipt_id == payload.receipt_id
            ).first()
            event_id = existing_event.id if existing_event else 1
            return ReceiptResponse(
                status="success",
                message="Receipt already processed (idempotent)",
                event_id=event_id,
                communication_id=comm.id,
                new_status=comm.status
            )

        # Log new idempotency key
        db.add(ReceiptIdempotency(idempotency_key=payload.receipt_id))

    # 3. Update communication status
    comm.status = payload.status
    db.add(comm)

    # 4. Store event history matching new columns
    event = CommunicationEvent(
        message_id=comm.id,
        campaign_id=comm.campaign_id,
        customer_id=comm.customer_id,
        status=payload.status,
        receipt_id=payload.receipt_id,
        retry_count=payload.retry_count or 0,
        details=payload.details
    )
    db.add(event)
    
    db.flush()
    return event, comm.id, comm.status

@router.post("/receipts", response_model=ReceiptResponse, status_code=status.HTTP_201_CREATED)
def record_receipt(
    payload: ReceiptCreate,
    db: Session = Depends(get_db)
):
    max_retries = 5
    initial_backoff = 0.05
    backoff = initial_backoff
    
    for attempt in range(1, max_retries + 1):
        try:
            result = update_communication_and_log_event(db, payload)
            
            if isinstance(result, ReceiptResponse):
                return result
                
            db.commit()
            event, comm_id, status_val = result
            db.refresh(event)
            
            return ReceiptResponse(
                status="success",
                message="Receipt processed successfully",
                event_id=event.id,
                communication_id=comm_id,
                new_status=status_val
            )
            
        except OperationalError as e:
            db.rollback()
            if attempt == max_retries:
                logger.error(f"Failed to record receipt after {max_retries} attempts due to database concurrency locks: {e}")
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Database is busy, please retry later"
                )
            
            sleep_time = backoff * (0.5 + random.random())
            logger.warning(
                f"SQLite OperationalError (busy lock) on attempt {attempt}/{max_retries}. "
                f"Retrying in {sleep_time:.2f} seconds..."
            )
            time.sleep(sleep_time)
            backoff *= 2
            
        except HTTPException as e:
            db.rollback()
            raise e
        except Exception as e:
            db.rollback()
            logger.error(f"Unexpected error processing receipt callback: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to process receipt: {e}"
            )

from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Communication
from app.schemas.communication import CommunicationCallback

router = APIRouter()

@router.post("/callback", status_code=status.HTTP_201_CREATED)
def record_communication_callback(
    payload: CommunicationCallback,
    db: Session = Depends(get_db)
):
    try:
        db_comm = Communication(
            customer_id=payload.customer_id,
            campaign_id=payload.campaign_id,
            type=payload.type,
            status=payload.status
        )
        db.add(db_comm)
        db.commit()
        db.refresh(db_comm)
        return {"status": "success", "id": db_comm.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to record communication log: {e}"
        )

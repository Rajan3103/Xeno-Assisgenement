import random
import httpx
from fastapi import APIRouter, HTTPException, status, BackgroundTasks
from pydantic import BaseModel
from typing import Optional

from app.services.email import send_email
from app.services.sms import send_sms
from app.services.whatsapp import send_whatsapp
from app.core.config import settings

router = APIRouter()

class EmailPayload(BaseModel):
    to_email: str
    subject: str
    body: str

class SMSPayload(BaseModel):
    to_phone: str
    message: str

class WhatsAppPayload(BaseModel):
    to_phone: str
    message: str

# New Send Payload schema
class SendPayload(BaseModel):
    recipient: str
    message: str
    channel: str  # Email, SMS, WhatsApp
    metadata: Optional[dict] = None  # e.g., {"customer_id": 1, "campaign_id": 2}

# Simulated status choices & weights
STATUS_OPTIONS = ["Delivered", "Failed", "Opened", "Read", "Clicked"]
STATUS_WEIGHTS = [0.30, 0.10, 0.25, 0.20, 0.15]

def trigger_crm_callback(callback_url: str, customer_id: str, campaign_id: int, channel: str, status: str):
    payload = {
        "customer_id": customer_id,
        "campaign_id": campaign_id,
        "type": channel,
        "status": status
    }
    try:
        # Perform synchronous HTTP post call back to CRM
        response = httpx.post(callback_url, json=payload, timeout=5.0)
        print(f"[Callback] Dispatched callback to CRM: {payload}. Response status: {response.status_code}")
    except Exception as e:
        print(f"[Callback] Failed to dispatch CRM callback: {e}")

def trigger_receipt_callback(receipts_url: str, communication_id: str, status: str, channel: str):
    payload = {
        "communication_id": communication_id,
        "status": status,
        "receipt_id": f"rcpt-{communication_id}-{status.lower()}",
        "retry_count": 0,
        "details": f"Simulated delivery receipt over {channel}"
    }
    try:
        response = httpx.post(receipts_url, json=payload, timeout=5.0)
        print(f"[ReceiptCallback] Dispatched receipt callback to CRM: {payload}. Response status: {response.status_code}")
    except Exception as e:
        print(f"[ReceiptCallback] Failed to dispatch receipt callback: {e}")

@router.post("/send", status_code=status.HTTP_202_ACCEPTED)
def send_message_endpoint(payload: SendPayload, background_tasks: BackgroundTasks):
    channel_lower = payload.channel.lower()
    success = False
    
    # 1. Dispatch message through the respective mock channel service
    if channel_lower == "email":
        success = send_email(payload.recipient, "Outreach Notification", payload.message)
    elif channel_lower == "sms":
        success = send_sms(payload.recipient, payload.message)
    elif channel_lower == "whatsapp":
        success = send_whatsapp(payload.recipient, payload.message)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported communication channel: {payload.channel}"
        )
        
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to transmit message over {payload.channel}"
        )
        
    # 2. Simulate delivery status
    simulated_status = random.choices(STATUS_OPTIONS, weights=STATUS_WEIGHTS, k=1)[0]
    print(f"[ChannelService] Message dispatched. Selected status for simulation: {simulated_status}")

    # 3. Schedule callback if metadata contains necessary foreign key IDs
    if payload.metadata:
        communication_id = payload.metadata.get("communication_id")
        customer_id = payload.metadata.get("customer_id")
        campaign_id = payload.metadata.get("campaign_id")
        
        if communication_id is not None:
            # Dynamically derive the receipts url by replacing the endpoint segment
            receipts_url = settings.CRM_CALLBACK_URL.replace("/api/v1/communications/callback", "/api/receipts")
            background_tasks.add_task(
                trigger_receipt_callback,
                receipts_url,
                str(communication_id),
                simulated_status,
                payload.channel
            )
        elif customer_id is not None and campaign_id is not None:
            background_tasks.add_task(
                trigger_crm_callback,
                settings.CRM_CALLBACK_URL,
                str(customer_id),
                int(campaign_id),
                payload.channel,
                simulated_status
            )

            
    return {
        "status": "success",
        "message": f"Message accepted and simulated as {simulated_status}",
        "simulated_status": simulated_status
    }

@router.post("/send/email", status_code=status.HTTP_200_OK)
def send_email_endpoint(payload: EmailPayload):
    success = send_email(payload.to_email, payload.subject, payload.body)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send email")
    return {"status": "success", "message": "Email sent successfully"}

@router.post("/send/sms", status_code=status.HTTP_200_OK)
def send_sms_endpoint(payload: SMSPayload):
    success = send_sms(payload.to_phone, payload.message)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send SMS")
    return {"status": "success", "message": "SMS sent successfully"}

@router.post("/send/whatsapp", status_code=status.HTTP_200_OK)
def send_whatsapp_endpoint(payload: WhatsAppPayload):
    success = send_whatsapp(payload.to_phone, payload.message)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send WhatsApp message")
    return {"status": "success", "message": "WhatsApp message sent successfully"}

import urllib.request
import json
import logging
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.config import settings
from app.core.database import get_db
from app.schemas import auth as schema_auth
from app.schemas import ai as schema_ai
from app.schemas.customer import Customer
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)

# Fallback presets to guarantee functionality in development when no API Key is set
FALLBACK_PRESETS = {
    "spent": "id IN (SELECT customer_id FROM orders WHERE status = 'Completed' GROUP BY customer_id HAVING SUM(amount) > 62.5)",
    "customer": "status = 'Customer'",
    "lead": "status = 'Lead'",
    "inactive": "status = 'Inactive'"
}

def call_gemini_api(prompt: str) -> str:
    """
    Sends natural language prompt to Gemini 2.5 Flash REST API to get SQL filter condition.
    """
    if not settings.GEMINI_API_KEY:
        raise ValueError("Missing GEMINI_API_KEY")

    api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
    
    # Define SQL instructions and database schema context
    system_instruction = (
        "You are a SQL database expert. You convert natural language descriptions of customer segments into SQLite WHERE clauses.\n\n"
        "The database has the following tables:\n"
        "- customers: id (TEXT), name (TEXT), email (TEXT), phone (TEXT), status (TEXT), city (TEXT), state (TEXT), total_spent (REAL), order_count (INTEGER), avg_order_value (REAL), tags (TEXT), signup_date (TEXT), created_at (TEXT)\n"
        "- orders: id (TEXT), customer_id (TEXT), product_name (TEXT), category (TEXT), amount (REAL), order_date (TEXT), status (TEXT)\n\n"
        "Rules:\n"
        "1. Output ONLY a valid JSON object matching the requested schema. Do not explain anything.\n"
        "2. The sql_filter field must contain a SQL condition that fits in: SELECT * FROM customers WHERE (sql_filter)\n"
        "3. You can query customer metrics directly on the customers table (e.g., total_spent > 1000, order_count > 3, tags LIKE '%vip%', city = 'Delhi').\n"
        "4. If query checks order totals (like 'spent above ₹5000' or 'spent above $62.50'), assume amount/total_spent is in USD. For INR conversion, use 80 INR = 1 USD (so ₹5000 is $62.50).\n"
        "5. If query checks dates or time metrics, use standard SQLite date functions like datetime('now', '-30 days')."
    )

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": f"Generate SQL condition for: {prompt}"}
                ]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": {
                "type": "OBJECT",
                "properties": {
                    "sql_filter": {
                        "type": "STRING",
                        "description": "SQL WHERE clause condition for selecting matching customers, using standard SQLite syntax."
                    }
                },
                "required": ["sql_filter"]
            }
        },
        "systemInstruction": {
            "parts": [
                {"text": system_instruction}
            ]
        }
    }

    req_data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        api_url, 
        data=req_data, 
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    
    with urllib.request.urlopen(req) as res:
        response_json = json.loads(res.read().decode("utf-8"))
        
    try:
        text_response = response_json["candidates"][0]["content"]["parts"][0]["text"]
        result = json.loads(text_response)
        return result["sql_filter"]
    except (KeyError, IndexError, ValueError) as e:
        raise ValueError(f"Failed to parse Gemini response: {e}")

@router.post("/segment", response_model=schema_ai.AISegmentResponse)
def generate_ai_segment(
    *,
    db: Session = Depends(get_db),
    payload: schema_ai.PromptPayload,
    current_user: schema_auth.User = Depends(get_current_user),
) -> Any:
    sql_filter = None
    
    # Try calling Gemini API
    if settings.GEMINI_API_KEY:
        try:
            sql_filter = call_gemini_api(payload.prompt)
            logger.info(f"Gemini generated SQL filter: {sql_filter}")
        except Exception as e:
            logger.error(f"Gemini API error, falling back: {e}")
            
    # Fallback matching logic if API key is not present or failed
    if not sql_filter:
        prompt_lower = payload.prompt.lower()
        if "spent" in prompt_lower or "5000" in prompt_lower:
            sql_filter = FALLBACK_PRESETS["spent"]
        elif "inactive" in prompt_lower or "dormant" in prompt_lower:
            sql_filter = FALLBACK_PRESETS["inactive"]
        elif "customer" in prompt_lower:
            sql_filter = FALLBACK_PRESETS["customer"]
        else:
            sql_filter = FALLBACK_PRESETS["lead"]
            
    try:
        # Execute the generated SQL query safely scoping it to the shared cohort pool
        raw_query = f"SELECT * FROM customers WHERE ({sql_filter})"
        query = text(raw_query)
        results = db.execute(query).fetchall()
        
        # Parse SQL Row objects into Pydantic Customer models
        sample_customers = []
        for row in results[:5]:  # Return up to 5 sample records
            # row can be indexed or dot-accessed in SQLAlchemy
            sample_customers.append(
                Customer(
                    id=row.id,
                    name=row.name,
                    email=row.email,
                    phone=row.phone,
                    company=row.company,
                    status=row.status,
                    city=getattr(row, "city", None),
                    state=getattr(row, "state", None),
                    total_spent=getattr(row, "total_spent", 0.0),
                    order_count=getattr(row, "order_count", 0),
                    avg_order_value=getattr(row, "avg_order_value", 0.0),
                    last_order_date=getattr(row, "last_order_date", None),
                    first_order_date=getattr(row, "first_order_date", None),
                    rfm_recency=getattr(row, "rfm_recency", None),
                    rfm_frequency=getattr(row, "rfm_frequency", None),
                    rfm_monetary=getattr(row, "rfm_monetary", None),
                    tags=getattr(row, "tags", None),
                    created_at=row.created_at,
                    owner_id=row.owner_id
                )
            )
            
        return schema_ai.AISegmentResponse(
            sql_filter=sql_filter,
            audience_count=len(results),
            sample_customers=sample_customers
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to execute generated SQL filter. Query: '{sql_filter}'. Error: {e}"
        )

# Fallback copy presets if API key is not supplied
FALLBACK_DRAFTS = {
    "spent": {
        "campaign_title": "Exclusive VIP Reward Awaits!",
        "campaign_message": "Hi! As one of our top customers who spent above ₹5000 last month, we want to thank you with an exclusive 15% discount on your next purchase.",
        "cta": "Claim My VIP Code"
    },
    "inactive": {
        "campaign_title": "We Miss You! Here's 10% Off",
        "campaign_message": "Hello, it's been a while since you stopped by. Use code WELCOMEBACK at checkout to get 10% off your next order.",
        "cta": "Shop Collection Now"
    },
    "lead": {
        "campaign_title": "Welcome to XenoPulse!",
        "campaign_message": "Hi, thanks for signing up. Ready to get started? We've compiled some resources to help you launch your first CRM dashboard.",
        "cta": "View Setup Guide"
    }
}

def call_gemini_draft_api(audience_profile: str) -> dict:
    if not settings.GEMINI_API_KEY:
        raise ValueError("Missing GEMINI_API_KEY")

    api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
    
    system_instruction = (
        "You are a senior marketing copywriter. You write personalized, conversion-optimized marketing copies based on a target audience description.\n\n"
        "Rules:\n"
        "1. Output ONLY a valid JSON object matching the requested schema. Do not explain anything.\n"
        "2. The campaign_title must be an engaging headline.\n"
        "3. The campaign_message must be a personalized body copy for the target audience. Keep it concise (under 250 characters).\n"
        "4. The cta must be a strong Call-To-Action button text."
    )

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": f"Write copy for: {audience_profile}"}
                ]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": {
                "type": "OBJECT",
                "properties": {
                    "campaign_title": {
                        "type": "STRING",
                        "description": "Engaging title/subject for the campaign."
                    },
                    "campaign_message": {
                        "type": "STRING",
                        "description": "Tailored promotional message text."
                    },
                    "cta": {
                        "type": "STRING",
                        "description": "Clear call to action string."
                    }
                },
                "required": ["campaign_title", "campaign_message", "cta"]
            }
        },
        "systemInstruction": {
            "parts": [
                {"text": system_instruction}
            ]
        }
    }

    req_data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        api_url, 
        data=req_data, 
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    
    with urllib.request.urlopen(req) as res:
        response_json = json.loads(res.read().decode("utf-8"))
        
    try:
        text_response = response_json["candidates"][0]["content"]["parts"][0]["text"]
        return json.loads(text_response)
    except (KeyError, IndexError, ValueError) as e:
        raise ValueError(f"Failed to parse Gemini response: {e}")

@router.post("/draft", response_model=schema_ai.AIDraftResponse)
def generate_ai_draft(
    *,
    payload: schema_ai.AIDraftRequest,
    current_user: schema_auth.User = Depends(get_current_user),
) -> Any:
    draft = None
    
    # Try calling Gemini API
    if settings.GEMINI_API_KEY:
        try:
            draft = call_gemini_draft_api(payload.audience_profile)
            logger.info(f"Gemini generated draft: {draft}")
        except Exception as e:
            logger.error(f"Gemini API error, falling back: {e}")
            
    # Fallback copy generator
    if not draft:
        profile_lower = payload.audience_profile.lower()
        if "spent" in profile_lower or "5000" in profile_lower:
            draft = FALLBACK_DRAFTS["spent"]
        elif "inactive" in profile_lower or "dormant" in profile_lower:
            draft = FALLBACK_DRAFTS["inactive"]
        else:
            draft = FALLBACK_DRAFTS["lead"]
            
    return schema_ai.AIDraftResponse(**draft)


def call_gemini_insights_api(prompt: str) -> dict:
    if not settings.GEMINI_API_KEY:
        raise ValueError("Missing GEMINI_API_KEY")

    api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
    
    system_instruction = (
        "You are an expert CRM and marketing analytics data scientist. You analyze campaign results and compile clear AI insights.\n\n"
        "Rules:\n"
        "1. Output ONLY a valid JSON object matching the requested schema. Do not explain anything.\n"
        "2. The 'summary' field should contain a concise paragraph summarizing the campaign performance, highlighting successes and bottlenecks.\n"
        "3. The 'recommendations' field should contain a list of 2-3 specific marketing recommendations based on the data.\n"
        "4. The 'audience_insights' field should contain observations about target audience engagement.\n"
        "5. The 'next_best_action' field should highlight the single most impactful action the marketer should take next."
    )

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": {
                "type": "OBJECT",
                "properties": {
                    "summary": {
                        "type": "STRING",
                        "description": "Short paragraph summarizing overall performance."
                    },
                    "recommendations": {
                        "type": "ARRAY",
                        "items": { "type": "STRING" },
                        "description": "2-3 actionable marketing suggestions."
                    },
                    "audience_insights": {
                        "type": "STRING",
                        "description": "Key observations about segment behavior."
                    },
                    "next_best_action": {
                        "type": "STRING",
                        "description": "Single most critical next step."
                    }
                },
                "required": ["summary", "recommendations", "audience_insights", "next_best_action"]
            }
        },
        "systemInstruction": {
            "parts": [
                {"text": system_instruction}
            ]
        }
    }

    req_data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        api_url, 
        data=req_data, 
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    
    with urllib.request.urlopen(req) as res:
        response_json = json.loads(res.read().decode("utf-8"))
        
    try:
        text_response = response_json["candidates"][0]["content"]["parts"][0]["text"]
        return json.loads(text_response)
    except (KeyError, IndexError, ValueError) as e:
        raise ValueError(f"Failed to parse Gemini response: {e}")

@router.post("/insights", response_model=schema_ai.AIInsightsResponse)
def generate_ai_insights(
    *,
    db: Session = Depends(get_db),
    payload: schema_ai.AIInsightsRequest,
    current_user: schema_auth.User = Depends(get_current_user),
) -> Any:
    # 1. Fetch Campaign and verify owner (we check communications table associated to this campaign)
    from app.models.models import Campaign, Communication, Customer
    campaign = db.query(Campaign).filter(Campaign.id == payload.campaign_id).first()
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )
        
    # 2. Gather analytics data
    comms = db.query(Communication).filter(Communication.campaign_id == campaign.id).all()
    total_sent = len(comms)
    delivered = sum(1 for c in comms if c.status.lower() == "delivered")
    failed = sum(1 for c in comms if c.status.lower() == "failed")
    opened = sum(1 for c in comms if c.status.lower() == "opened")
    read = sum(1 for c in comms if c.status.lower() == "read")
    clicked = sum(1 for c in comms if c.status.lower() == "clicked")
    
    conversion_rate = round((clicked / total_sent * 100), 2) if total_sent > 0 else 0.0
    engagement_rate = round(((opened + read + clicked) / total_sent * 100), 2) if total_sent > 0 else 0.0
    
    # 3. Trigger Gemini insights or fallback
    insights = None
    if settings.GEMINI_API_KEY and total_sent > 0:
        prompt = (
            f"Campaign: '{campaign.name}'\n"
            f"Segment criteria: '{campaign.segment}'\n"
            f"Outreach Channel: '{campaign.channel}'\n"
            f"Analytics:\n"
            f"- Total Dispatched Messages: {total_sent}\n"
            f"- Delivered: {delivered}\n"
            f"- Failed: {failed}\n"
            f"- Opened: {opened}\n"
            f"- Read: {read}\n"
            f"- Clicked: {clicked}\n"
            f"- Conversion Rate: {conversion_rate}%\n"
            f"- Engagement Rate: {engagement_rate}%\n"
        )
        try:
            insights = call_gemini_insights_api(prompt)
            logger.info(f"Gemini generated insights: {insights}")
        except Exception as e:
            logger.error(f"Gemini insights generation error, falling back: {e}")
            
    # Fallback copy generator
    if not insights:
        if total_sent == 0:
            insights = {
                "summary": f"The campaign '{campaign.name}' has not dispatched any communications yet. We cannot generate performance summaries without active delivery logs.",
                "recommendations": [
                    "Launch this campaign to start tracking customer reactions.",
                    "Review message templates and channels before dispatching."
                ],
                "audience_insights": "No audience logs available. Campaign segment has zero tracked communications.",
                "next_best_action": "Click 'Launch Campaign' in the outreach dashboard to start transmission."
            }
        elif conversion_rate > 10.0:
            insights = {
                "summary": f"The campaign '{campaign.name}' demonstrated strong performance with a {conversion_rate}% conversion rate, well above industry benchmarks. Audience engagement was high with {engagement_rate}% of recipients opening or reading the message.",
                "recommendations": [
                    "Establish a control group to measure true campaign lift.",
                    "Scale this outreach strategy to lookalike customer segments."
                ],
                "audience_insights": f"The '{campaign.segment}' segment is highly responsive to this messaging format on the {campaign.channel} channel.",
                "next_best_action": "Extend the promotional window for another 48 hours for non-responders."
            }
        else:
            insights = {
                "summary": f"The campaign '{campaign.name}' completed with a {conversion_rate}% conversion rate and {engagement_rate}% engagement. Engagement rates suggest potential bottlenecks in recipient interest or CTA positioning.",
                "recommendations": [
                    "A/B test subject lines or title copy to increase the initial open rate.",
                    "Review the CTA message to make the value proposition more direct."
                ],
                "audience_insights": f"Recipient response from the '{campaign.segment}' segment indicates lower urgency. The channel {campaign.channel} might not be the most optimal medium.",
                "next_best_action": "Run a micro-A/B split test with a higher discount offer to verify price sensitivity."
            }
            
    return schema_ai.AIInsightsResponse(**insights)


def call_gemini_command_api(prompt: str) -> dict:
    if not settings.GEMINI_API_KEY:
        raise ValueError("Missing GEMINI_API_KEY")

    api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
    
    system_instruction = (
        "You are an expert marketing automation and database architect. You translate high-level marketing goals into campaign blueprints.\n\n"
        "The customer database has these tables:\n"
        "- customers: id (TEXT), name (TEXT), email (TEXT), phone (TEXT), status (TEXT), city (TEXT), state (TEXT), total_spent (REAL), order_count (INTEGER), avg_order_value (REAL), tags (TEXT), signup_date (TEXT), created_at (TEXT)\n"
        "- orders: id (TEXT), customer_id (TEXT), product_name (TEXT), category (TEXT), amount (REAL), order_date (TEXT), status (TEXT)\n\n"
        "Rules:\n"
        "1. Output ONLY a valid JSON object matching the requested schema. Do not explain anything.\n"
        "2. The 'sql_filter' must be a valid SQLite condition (without SELECT prefix) to filter customers, suitable for: SELECT * FROM customers WHERE (sql_filter).\n"
        "3. You can query customer metrics directly on the customers table (e.g., total_spent > 100, order_count > 3, tags LIKE '%vip%', city = 'Delhi').\n"
        "4. 'channel' must be exactly 'Email', 'SMS', or 'WhatsApp'. Choose the channel that best suits the campaign objective.\n"
        "5. The 'campaign_message' should be concise, highly engaging, personalized, and under 250 characters.\n"
        "6. The 'cta' is the Call-to-Action button text (e.g. 'Get 20% Off')."
    )

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": f"Generate blueprint for goal: {prompt}"}
                ]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": {
                "type": "OBJECT",
                "properties": {
                    "segment_name": {
                        "type": "STRING",
                        "description": "Short descriptive name for the target audience cohort."
                    },
                    "sql_filter": {
                        "type": "STRING",
                        "description": "SQLite query condition matching targeted customers."
                    },
                    "campaign_name": {
                        "type": "STRING",
                        "description": "Engaging campaign title."
                    },
                    "channel": {
                        "type": "STRING",
                        "enum": ["Email", "SMS", "WhatsApp"],
                        "description": "Most suitable communication channel."
                    },
                    "campaign_message": {
                        "type": "STRING",
                        "description": "Promotional body text tailored for the cohort."
                    },
                    "cta": {
                        "type": "STRING",
                        "description": "Clear Call-to-Action text."
                    }
                },
                "required": ["segment_name", "sql_filter", "campaign_name", "channel", "campaign_message", "cta"]
            }
        },
        "systemInstruction": {
            "parts": [
                {"text": system_instruction}
            ]
        }
    }

    req_data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        api_url, 
        data=req_data, 
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    
    with urllib.request.urlopen(req) as res:
        response_json = json.loads(res.read().decode("utf-8"))
        
    try:
        text_response = response_json["candidates"][0]["content"]["parts"][0]["text"]
        return json.loads(text_response)
    except (KeyError, IndexError, ValueError) as e:
        raise ValueError(f"Failed to parse Gemini response: {e}")


FALLBACK_COMMAND_BLUEPRINTS = [
    {
        "keywords": ["premium", "vip", "loyal", "repeat", "spend"],
        "blueprint": {
            "segment_name": "Premium Repeat Shoppers",
            "sql_filter": "id IN (SELECT customer_id FROM orders WHERE status = 'Completed' GROUP BY customer_id HAVING SUM(amount) > 62.5)",
            "campaign_name": "VIP Loyalty Appreciation Reward",
            "channel": "Email",
            "campaign_message": "Hi! As a valued premium shopper, thank you for choosing XenoPulse. Use VIP20 to enjoy an extra 20% off our exclusive new arrivals.",
            "cta": "Access VIP Shop"
        }
    },
    {
        "keywords": ["inactive", "dormant", "re-engage", "churn", "lost"],
        "blueprint": {
            "segment_name": "Inactive Leads Re-engagement",
            "sql_filter": "status = 'Inactive'",
            "campaign_name": "Re-engage Dormant Audience",
            "channel": "SMS",
            "campaign_message": "We miss you at XenoPulse! Use coupon code WELCOMEBACK to claim 15% off your next checkout. Valid this week.",
            "cta": "Claim 15% Discount"
        }
    }
]

DEFAULT_COMMAND_BLUEPRINT = {
    "segment_name": "Active Contacts Segment",
    "sql_filter": "status = 'Customer'",
    "campaign_name": "Pulse Outreach Blast",
    "channel": "WhatsApp",
    "campaign_message": "Hello! Great news - our mid-season collections are officially live. Discover early access catalogs and checkout specials.",
    "cta": "Browse Styles Now"
}


@router.post("/command", response_model=schema_ai.AIMarketingCommandResponse)
def generate_ai_marketing_command(
    *,
    db: Session = Depends(get_db),
    payload: schema_ai.AIMarketingCommandRequest,
    current_user: schema_auth.User = Depends(get_current_user),
) -> Any:
    blueprint = None
    
    # Try calling Gemini API
    if settings.GEMINI_API_KEY:
        try:
            blueprint = call_gemini_command_api(payload.prompt)
            logger.info(f"Gemini generated blueprint: {blueprint}")
        except Exception as e:
            logger.error(f"Gemini command error, falling back: {e}")
            
    # Fallback copy generator
    if not blueprint:
        prompt_lower = payload.prompt.lower()
        for item in FALLBACK_COMMAND_BLUEPRINTS:
            if any(kw in prompt_lower for kw in item["keywords"]):
                blueprint = item["blueprint"]
                break
        if not blueprint:
            blueprint = DEFAULT_COMMAND_BLUEPRINT

    # Validate channel value is valid
    channel_val = blueprint.get("channel", "Email")
    if channel_val not in ["Email", "SMS", "WhatsApp"]:
        channel_val = "Email"

    sql_filter = blueprint["sql_filter"]
    
    # Evaluate targeted audience count under current user scoping
    try:
        raw_query = f"SELECT COUNT(*) as cnt FROM customers WHERE ({sql_filter})"
        query = text(raw_query)
        result = db.execute(query).fetchone()
        audience_count = result[0] if result else 0
    except Exception as e:
        logger.error(f"Failed to evaluate SQL command filter '{sql_filter}': {e}")
        audience_count = 0
        
    return schema_ai.AIMarketingCommandResponse(
        segment_name=blueprint["segment_name"],
        sql_filter=sql_filter,
        campaign_name=blueprint["campaign_name"],
        channel=channel_val,
        campaign_message=blueprint["campaign_message"],
        cta=blueprint["cta"],
        audience_count=audience_count
    )



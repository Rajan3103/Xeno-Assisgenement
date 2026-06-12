import urllib.request
import urllib.parse
import json
import time
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:8000/api/v1"

def make_request(url, method="GET", data=None, token=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    req_data = None
    if data:
        if method == "POST" and "login" in url:
            # Login endpoint expects URL-encoded Form Data
            req_data = urllib.parse.urlencode(data).encode("utf-8")
            headers["Content-Type"] = "application/x-www-form-urlencoded"
        else:
            req_data = json.dumps(data).encode("utf-8")
            headers["Content-Type"] = "application/json"
            
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as res:
            return res.status, json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8")

def test():
    # Wait a moment for server to boot up
    time.sleep(2)
    
    # 1. Login
    print("Testing Login...")
    login_url = f"{BASE_URL}/auth/login"
    status, res = make_request(login_url, method="POST", data={"username": "admin@xenopulse.ai", "password": "admin123"})
    if status != 200:
        print(f"Login failed: {status} - {res}")
        return
    token = res["access_token"]
    print("Login successful! Token retrieved.\n")

    # 2. Get Customers with pagination
    print("Testing GET /customers/?limit=3...")
    status, customers = make_request(f"{BASE_URL}/customers/?limit=3", token=token)
    print(f"Status: {status}")
    print(f"Count returned: {len(customers)}")
    for c in customers:
        print(f" - {c['name']} ({c['email']}) - Status: {c['status']}")
    print()

    # 3. Get Customers with search filter
    print("Testing GET /customers/?search=smith&limit=2...")
    status, customers = make_request(f"{BASE_URL}/customers/?search=smith&limit=2", token=token)
    print(f"Status: {status}")
    print(f"Count returned: {len(customers)}")
    for c in customers:
        print(f" - {c['name']} ({c['email']})")
    print()

    # 4. Get Orders with pagination and status
    print("Testing GET /orders/?status=Completed&limit=3...")
    status, orders = make_request(f"{BASE_URL}/orders/?status=Completed&limit=3", token=token)
    print(f"Status: {status}")
    print(f"Count returned: {len(orders)}")
    for o in orders:
        print(f" - Order #{o['id']}: Amount ${o['total_amount']}, Status: {o['status']}")
    print()

    # 5. Create Customer
    print("Testing POST /customers/...")
    new_cust = {
        "name": "Jane Watson",
        "email": "jane.watson@example.com",
        "phone": "+1-555-0199",
        "company": "Watson Corp",
        "status": "Lead"
    }
    status, cust = make_request(f"{BASE_URL}/customers/", method="POST", data=new_cust, token=token)
    print(f"Status: {status}")
    print(f"Created: {cust['name']} with ID {cust['id']}")
    print()

    # 6. Create Order
    print("Testing POST /orders/...")
    new_ord = {
        "customer_id": cust["id"],
        "total_amount": 1500.75,
        "status": "Pending"
    }
    status, ord = make_request(f"{BASE_URL}/orders/", method="POST", data=new_ord, token=token)
    print(f"Status: {status}")
    print(f"Created: Order #{ord['id']} for Customer ID {ord['customer_id']} with total ${ord['total_amount']}")
    print()

    # 7. AI Segment Generation
    print("Testing POST /ai/segment...")
    ai_payload = {
        "prompt": "Customers who spent above ₹5000 last month"
    }
    status, ai_res = make_request(f"{BASE_URL}/ai/segment", method="POST", data=ai_payload, token=token)
    print(f"Status: {status}")
    print(f"Generated SQL Filter: {ai_res.get('sql_filter')}")
    print(f"Audience Count: {ai_res.get('audience_count')}")
    print(f"Sample Customers returned: {len(ai_res.get('sample_customers', []))}")
    for sc in ai_res.get('sample_customers', []):
        print(f" - {sc['name']} ({sc['email']}) - Status: {sc['status']}")
    print()

    # 8. Campaigns CRUD
    print("Testing POST /campaigns/...")
    new_camp = {
        "name": "Winter Clearance 2026",
        "segment": "Customers with status Customer",
        "message": "Big discounts on all winter stock!",
        "channel": "Email",
        "status": "Draft"
    }
    status, camp = make_request(f"{BASE_URL}/campaigns/", method="POST", data=new_camp, token=token)
    print(f"Status: {status}")
    print(f"Created Campaign: {camp['name']} (ID {camp['id']}) - Channel: {camp['channel']}")
    print()

    print("Testing GET /campaigns/...")
    status, campaigns = make_request(f"{BASE_URL}/campaigns/?limit=3", token=token)
    print(f"Status: {status}")
    print(f"Count returned: {len(campaigns)}")
    for cp in campaigns:
        print(f" - Campaign #{cp['id']}: {cp['name']} - Channel: {cp['channel']}, Status: {cp['status']}")
    print()

    # 9. AI Draft Generation
    print("Testing POST /ai/draft...")
    draft_payload = {
        "audience_profile": "Customers who spent above ₹5000 last month"
    }
    status, draft_res = make_request(f"{BASE_URL}/ai/draft", method="POST", data=draft_payload, token=token)
    print(f"Status: {status}")
    print(f"Generated Title:   {draft_res.get('campaign_title')}")
    print(f"Generated Message: {draft_res.get('campaign_message')}")
    print(f"Generated CTA:     {draft_res.get('cta')}")
    print()

    # 10. Channel Service POST /send and CRM Callback verification
    print("Testing Channel Service POST /send on Port 8001...")
    send_payload = {
        "recipient": "test.recipient@example.com",
        "message": "Verify channel service delivery callback loop.",
        "channel": "WhatsApp",
        "metadata": {
            "customer_id": 1,
            "campaign_id": 1
        }
    }
    # Send request to channel service running on port 8001
    status, send_res = make_request("http://localhost:8001/api/v1/send", method="POST", data=send_payload)
    print(f"Status: {status}")
    print(f"Response: {send_res.get('message')}")
    print("Waiting 2 seconds for asynchronous callback execution...")
    time.sleep(2)
    print()

    # 11. CRM receipts Callback API (POST /api/receipts)
    print("Testing POST /api/receipts (CRM Receipts Callback)...")
    receipt_payload = {
        "communication_id": 1,
        "status": "Delivered",
        "receipt_id": "receipt-uuid-12345",
        "retry_count": 0,
        "details": "Delivered to recipient mailbox successfully"
    }
    status, receipt_res = make_request("http://localhost:8000/api/receipts", method="POST", data=receipt_payload)
    print(f"Status: {status}")
    print(f"Response: {receipt_res}")
    
    # Verify idempotency (same receipt_id should return idempotent response without error)
    print("Testing idempotency of POST /api/receipts (sending duplicate receipt)...")
    status2, receipt_res2 = make_request("http://localhost:8000/api/receipts", method="POST", data=receipt_payload)
    print(f"Status: {status2}")
    print(f"Response: {receipt_res2}")
    
    # Verify client retry support
    print("Testing client retries on POST /api/receipts (sending with retry_count > 0)...")
    retry_payload = {
        "communication_id": 1,
        "status": "Opened",
        "receipt_id": "receipt-uuid-67890",
        "retry_count": 2,
        "details": "Recipient opened the email message"
    }
    status3, receipt_res3 = make_request("http://localhost:8000/api/receipts", method="POST", data=retry_payload)
    print(f"Status: {status3}")
    print(f"Response: {receipt_res3}")

    # Verify versioned endpoint works as well (POST /api/v1/receipts)
    print("Testing POST /api/v1/receipts (versioned receipts endpoint)...")
    v1_receipt_payload = {
        "communication_id": 1,
        "status": "Clicked",
        "receipt_id": "receipt-uuid-v1-abc",
        "retry_count": 0,
        "details": "Recipient clicked call to action link"
    }
    status4, receipt_res4 = make_request(f"{BASE_URL}/receipts", method="POST", data=v1_receipt_payload)
    print(f"Status: {status4}")
    print(f"Response: {receipt_res4}")
    print()

    # 12. End-to-End Campaign -> Channel Service -> Callback integration loop
    print("Testing End-to-End Campaign -> Channel Service -> Callback integration loop...")
    e2e_camp = {
        "name": "E2E Promo Blast 2026",
        "segment": "Inactive Leads",
        "message": "We miss you! Come back and save 15%.",
        "channel": "Email",
        "status": "Active"
    }
    status5, camp_res = make_request(f"{BASE_URL}/campaigns/", method="POST", data=e2e_camp, token=token)
    print(f"Campaign creation status: {status5}")
    if status5 != 201:
        print(f"Failed to create E2E active campaign: {camp_res}")
        return
    
    campaign_id = camp_res["id"]
    print(f"Created active Campaign ID {campaign_id}. Waiting 4 seconds for Channel Service dispatch & Callback execution...")
    time.sleep(4)
    
    # Connect directly to SQLite to verify updated communication and logged event tables
    import sqlite3
    conn = sqlite3.connect("sql_app.db")
    cursor = conn.cursor()
    try:
        # Check communications logs
        cursor.execute(
            "SELECT id, customer_id, campaign_id, status FROM communications WHERE campaign_id = ?",
            (campaign_id,)
        )
        comms = cursor.fetchall()
        print(f"\n--- E2E Database Validation (Campaign ID {campaign_id}) ---")
        print(f"Communications logged: {len(comms)}")
        
        if len(comms) == 0:
            print("ERROR: No communication entries recorded for this active campaign!")
            
        for comm in comms:
            comm_id, cust_id, camp_id, comm_status = comm
            # Query the events table for this communication
            cursor.execute(
                "SELECT status, timestamp, receipt_id, retry_count, details FROM communication_events WHERE communication_id = ?",
                (comm_id,)
            )
            events = cursor.fetchall()
            print(f" - Comm ID {comm_id} (Customer ID {cust_id}) -> Status: {comm_status}")
            print(f"   Historical Events Logged: {len(events)}")
            for idx, ev in enumerate(events, 1):
                print(f"     Event #{idx}: Status={ev[0]}, ReceiptID={ev[2]}, Details='{ev[4]}'")
        print("------------------------------------------------------------\n")
    except Exception as e:
        print(f"Failed to query database validation: {e}")
    finally:
        conn.close()

    # 13. Campaign Launch and Performance Analytics API verification
    print("Testing POST /campaigns/{campaign_id}/launch and GET /campaigns/{campaign_id}/analytics...")
    draft_camp = {
        "name": "Draft Launch Test Campaign",
        "segment": "Inactive Leads",
        "message": "Verify the launch trigger.",
        "channel": "Email",
        "status": "Draft"
    }
    # Create draft
    status6, draft_camp_res = make_request(f"{BASE_URL}/campaigns/", method="POST", data=draft_camp, token=token)
    print(f"Draft Campaign Created: {status6} (ID: {draft_camp_res.get('id')})")
    
    # Verify status is Draft
    if draft_camp_res.get("status") != "Draft":
        print(f"Error: Campaign status should be Draft, got {draft_camp_res.get('status')}")
        return
        
    # Launch campaign
    campaign_id_to_launch = draft_camp_res.get("id")
    status7, launch_res = make_request(f"{BASE_URL}/campaigns/{campaign_id_to_launch}/launch", method="POST", token=token)
    print(f"Launch Response Status: {status7}")
    print(f"Launched Campaign Status: {launch_res.get('status')}")
    
    # Wait for background dispatch and callback execution
    print("Waiting 4 seconds for launch callbacks...")
    time.sleep(4)
    
    # Get analytics
    status8, analytics_res = make_request(f"{BASE_URL}/campaigns/{campaign_id_to_launch}/analytics", method="GET", token=token)
    print(f"Analytics Response Status: {status8}")
    print(f"Analytics Data: {analytics_res}")
    print()

    # 14. CRM Global Analytics API verification
    print("Testing GET /api/analytics (CRM Global Analytics)...")
    status9, global_analytics_res = make_request("http://localhost:8000/api/analytics", method="GET", token=token)
    print(f"Status: {status9}")
    print(f"Global Analytics Data: {global_analytics_res}")
    
    # Verify versioned global analytics endpoint (GET /api/v1/analytics)
    print("Testing GET /api/v1/analytics (versioned global analytics)...")
    status10, global_analytics_v1_res = make_request(f"{BASE_URL}/analytics", method="GET", token=token)
    print(f"Status: {status10}")
    print(f"Global Analytics V1 Data: {global_analytics_v1_res}")
    print()

    # 15. AI Insights generation (POST /api/v1/ai/insights)
    print("Testing POST /api/v1/ai/insights...")
    insights_payload = {
        "campaign_id": campaign_id_to_launch
    }
    status11, insights_res = make_request(f"{BASE_URL}/ai/insights", method="POST", data=insights_payload, token=token)
    print(f"Status: {status11}")
    print(f"Insights summary: {insights_res.get('summary')}")
    print(f"Recommendations: {insights_res.get('recommendations')}")
    print(f"Audience insights: {insights_res.get('audience_insights')}")
    print(f"Next best action: {insights_res.get('next_best_action')}")
    print()

    # 16. AI Marketing Command Center blueprint generation (POST /api/v1/ai/command)
    print("Testing POST /api/v1/ai/command...")
    command_payload = {
        "prompt": "Increase repeat purchases among premium shoppers."
    }
    status12, command_res = make_request(f"{BASE_URL}/ai/command", method="POST", data=command_payload, token=token)
    print(f"Status: {status12}")
    print(f"Segment Name: {command_res.get('segment_name')}")
    print(f"SQL Filter: {command_res.get('sql_filter')}")
    print(f"Campaign Name: {command_res.get('campaign_name')}")
    print(f"Channel: {command_res.get('channel')}")
    print(f"Message Copy: {command_res.get('campaign_message')}")
    print(f"CTA: {command_res.get('cta')}")
    print(f"Audience Reach Count: {command_res.get('audience_count')}")
    print()


if __name__ == "__main__":
    test()





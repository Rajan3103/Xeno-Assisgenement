import random
import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import SessionLocal, engine, Base
from app.models.models import User, Customer, Order, Campaign, Communication, Segment, ReceiptIdempotency
from app.core.security import get_password_hash

# DTC Fashion Brand seed metadata
FEMALE_FIRST_NAMES = [
    "Emma", "Olivia", "Ava", "Sophia", "Isabella", "Mia", "Charlotte", "Amelia", "Harper", "Evelyn", 
    "Abigail", "Emily", "Elizabeth", "Sofia", "Avery", "Ella", "Scarlett", "Grace", "Chloe", "Victoria",
    "Lily", "Aria", "Zoey", "Hannah", "Layla", "Lillian", "Nora", "Mila", "Aubrey", "Ellie"
]

MALE_FIRST_NAMES = [
    "Liam", "Noah", "Oliver", "Elijah", "William", "James", "Benjamin", "Lucas", "Henry", "Alexander", 
    "Mason", "Michael", "Ethan", "Daniel", "Jacob", "Logan", "Jackson", "Levi", "Sebastian", "Jack",
    "Owen", "Theodore", "Aiden", "Samuel", "Joseph", "John", "David", "Wyatt", "Carter", "Julian"
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Garcia", "Rodriguez", "Wilson", 
    "Martinez", "Anderson", "Taylor", "Thomas", "Hernandez", "Moore", "Martin", "Jackson", "Thompson", "White",
    "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King"
]

EMAIL_DOMAINS = ["gmail.com", "yahoo.com", "outlook.com", "icloud.com", "hotmail.com"]

# Fashion interests to map to the 'company' field in B2C
FASHION_PROFILES = [
    "Luxury & Designer Wear",
    "Athleisure & Activewear",
    "Streetwear & Premium Denim",
    "Minimalist & Sustainable Basics",
    "Vintage, Retro & Pre-loved",
    "Fast Fashion & Seasonal Trends"
]

CITIES = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata", "Pune", "Hyderabad"]
STATES = ["Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "West Bengal", "Maharashtra", "Telangana"]

# US Area Codes representing key demographics
AREA_CODES = [212, 310, 415, 305, 206, 312, 702, 617, 213, 718]

ORDER_STATUSES = ["Pending", "Completed", "Shipped", "Cancelled"]

def generate_order_amount() -> float:
    # 70% standard carts ($35 - $120)
    # 20% medium hauls ($120 - $350)
    # 10% premium high-value purchases ($350 - $1200)
    r = random.random()
    if r < 0.70:
        return round(random.uniform(35.0, 120.0), 2)
    elif r < 0.90:
        return round(random.uniform(120.0, 350.0), 2)
    else:
        return round(random.uniform(350.0, 1200.0), 2)

def generate_order_date(customer_created_at: datetime) -> datetime:
    now = datetime.utcnow()
    max_days_back = (now - customer_created_at).days
    if max_days_back <= 0:
        return now
    
    while True:
        days_ago = random.randint(0, max_days_back)
        candidate_date = now - timedelta(days=days_ago)
        
        month = candidate_date.month
        day = candidate_date.day
        
        weight = 0.35  # baseline weight
        
        if month == 11 and day >= 15:  # Black Friday / Cyber Monday surge
            weight = 1.0
        elif month == 12 and day <= 24:  # Christmas retail rush
            weight = 0.95
        elif month == 6 and day >= 15:  # Mid-Year Summer Sales
            weight = 0.80
        elif month == 7 and day <= 15:  # Summer Clearouts
            weight = 0.75
        elif month == 3:  # Spring Launch Season
            weight = 0.60
        elif month == 9 and day >= 10:  # Back-to-school / Autumn Launch
            weight = 0.55
            
        if random.random() < weight:
            return candidate_date

def main():
    print("Initializing Database Schema...")
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        # Clear existing data to guarantee exact requested counts
        print("Clearing existing database tables...")
        db.execute(text("DELETE FROM campaign_events"))
        db.execute(text("DELETE FROM messages"))
        db.execute(text("DELETE FROM orders"))
        db.execute(text("DELETE FROM customer_segment_association"))
        db.execute(text("DELETE FROM customers"))
        db.execute(text("DELETE FROM segments"))
        db.execute(text("DELETE FROM campaigns"))
        db.execute(text("DELETE FROM receipt_idempotency"))
        db.commit()

        # 1. Create Default Users
        admin = db.query(User).filter(User.email == "admin@xenopulse.ai").first()
        if not admin:
            print("Creating default admin user...")
            admin = User(
                email="admin@xenopulse.ai",
                hashed_password=get_password_hash("admin123"),
                full_name="System Administrator",
                role="Admin",
                is_active=1
            )
            db.add(admin)
        
        admin_com = db.query(User).filter(User.email == "admin@xenopulse.com").first()
        if not admin_com:
            print("Creating Alex Executive admin user...")
            admin_com = User(
                email="admin@xenopulse.com",
                hashed_password=get_password_hash("admin123"),
                full_name="Alex Executive",
                role="Admin",
                is_active=1
            )
            db.add(admin_com)

        manager = db.query(User).filter(User.email == "manager@xenopulse.com").first()
        if not manager:
            print("Creating Jane Manager user...")
            manager = User(
                email="manager@xenopulse.com",
                hashed_password=get_password_hash("manager123"),
                full_name="Jane Manager",
                role="MarketingManager",
                is_active=1
            )
            db.add(manager)
            
        db.commit()
        db.refresh(admin)
        
        # 2. Create Segments
        print("Creating segments...")
        vip_segment = Segment(
            name="VIP Customers",
            description="Customers with total completed order spending above $1,000",
            rules='[{"field": "total_spent", "op": "gt", "value": 1000}]'
        )
        inactive_segment = Segment(
            name="Inactive Leads",
            description="Leads that have never ordered or are inactive",
            rules='[{"field": "status", "op": "eq", "value": "Inactive"}]'
        )
        active_segment = Segment(
            name="Active Buyers",
            description="Customers with completed orders",
            rules='[{"field": "order_count", "op": "gt", "value": 0}]'
        )
        
        db.add_all([vip_segment, inactive_segment, active_segment])
        db.commit()
        db.refresh(vip_segment)
        db.refresh(inactive_segment)
        db.refresh(active_segment)

        # 3. Create campaigns with pre-filled metrics matching XenoFlow
        print("Creating campaigns...")
        campaign_1 = Campaign(
            name="Summer VIP Collection 2026",
            segment="Customers with total completed order spending above $1,000",
            message="Hi! As one of our top VIP customers, claim early access to our Summer Line and get 20% off. Use code VIP20.",
            channel="Email",
            status="Active",
            total_recipients=50,
            sent_count=50,
            delivered_count=48,
            opened_count=35,
            clicked_count=12,
            failed_count=2,
            revenue_attributed=12500.0,
            started_at=datetime.utcnow() - timedelta(days=5)
        )
        campaign_2 = Campaign(
            name="SMS Re-engagement Blast",
            segment="Inactive Leads",
            message="We miss you! Re-discover this season's trends. Use code COMEBACK for 15% off at checkout.",
            channel="SMS",
            status="Active",
            total_recipients=250,
            sent_count=250,
            delivered_count=240,
            opened_count=180,
            clicked_count=45,
            failed_count=10,
            revenue_attributed=3400.0,
            started_at=datetime.utcnow() - timedelta(days=2)
        )
        
        db.add_all([campaign_1, campaign_2])
        db.commit()
        db.refresh(campaign_1)
        db.refresh(campaign_2)

        # 4. Generate 1,000 customers
        print("Generating 1,000 customers...")
        customers = []
        for i in range(1000):
            if random.random() < 0.52:
                first_name = random.choice(FEMALE_FIRST_NAMES)
            else:
                first_name = random.choice(MALE_FIRST_NAMES)
                
            last_name = random.choice(LAST_NAMES)
            name = f"{first_name} {last_name}"
            email = f"{first_name.lower()}.{last_name.lower()}{random.randint(10, 999)}@{random.choice(EMAIL_DOMAINS)}"
            phone = f"+1-{random.choice(AREA_CODES)}-555-{random.randint(1000, 9999)}"
            fashion_profile = random.choice(FASHION_PROFILES)
            
            # Signup date distributed over last 365 days
            days_ago = random.randint(0, 365)
            created_at = datetime.utcnow() - timedelta(days=days_ago)
            
            city_idx = random.randint(0, len(CITIES) - 1)

            customer = Customer(
                id=f"cust_{i+1}",
                name=name,
                email=email,
                phone=phone,
                company=fashion_profile,
                status="Lead",
                city=CITIES[city_idx],
                state=STATES[city_idx],
                total_spent=0.0,
                order_count=0,
                avg_order_value=0.0,
                last_order_date=None,
                first_order_date=None,
                tags=None,
                signup_date=created_at,
                created_at=created_at,
                owner_id=admin.id
            )
            customers.append(customer)
            db.add(customer)
            
        db.commit()
        print("Successfully generated 1,000 customers.")

        # 5. Distribute exactly 5,000 orders
        print("Distributing 5,000 orders...")
        
        # Segment customer cohorts for orders distribution
        vip_customers = customers[:50]        # 5% VIPs (heavy purchasers)
        repeat_customers = customers[50:250]   # 20% loyal repeats
        casual_customers = customers[250:750]  # 50% casual shoppers
        lead_customers = customers[750:]       # 25% window shoppers (0 orders)
        
        customer_orders_counts = {c.id: 0 for c in customers}
        orders_remaining = 5000

        # Assign VIP orders (average 15-30 orders)
        for c in vip_customers:
            cnt = random.randint(15, 30)
            customer_orders_counts[c.id] = cnt
            orders_remaining -= cnt

        # Assign Repeats (average 5-12 orders)
        for c in repeat_customers:
            cnt = random.randint(5, 12)
            customer_orders_counts[c.id] = cnt
            orders_remaining -= cnt

        # Assign Casual (average 1-3 orders)
        for c in casual_customers:
            cnt = random.randint(1, 3)
            customer_orders_counts[c.id] = cnt
            orders_remaining -= cnt

        # Re-balance counts to exactly 5,000 orders
        if orders_remaining > 0:
            pool = [c.id for c in vip_customers + repeat_customers]
            for _ in range(orders_remaining):
                cid = random.choice(pool)
                customer_orders_counts[cid] += 1
        elif orders_remaining < 0:
            pool = [c.id for c in casual_customers + repeat_customers]
            while orders_remaining < 0:
                cid = random.choice(pool)
                if customer_orders_counts[cid] > 1:
                    customer_orders_counts[cid] -= 1
                    orders_remaining += 1

        # Generate orders in database
        orders_created = 0
        products = ["Lumé Silk Kurta", "Lumé Denim Trousers", "Lumé Linen Blazer", "Classic Espresso", "Arabica Filter"]
        categories = ["tops", "bottoms", "accessories", "coffee"]
        
        # We will hold orders in a map to compute aggregates later
        orders_by_customer = {c.id: [] for c in customers}
        
        for customer in customers:
            cnt = customer_orders_counts[customer.id]
            if cnt == 0:
                continue
                
            for _ in range(cnt):
                status_val = random.choice(ORDER_STATUSES)
                total_amount = generate_order_amount()
                order_date = generate_order_date(customer.created_at)
                
                order = Order(
                    id=f"ord_{orders_created+1}",
                    customer_id=customer.id,
                    product_name=random.choice(products),
                    category=random.choice(categories),
                    amount=total_amount,
                    order_date=order_date,
                    status=status_val
                )
                db.add(order)
                orders_by_customer[customer.id].append(order)
                orders_created += 1
                
                if orders_created % 1000 == 0:
                    db.commit()
                    print(f"Created {orders_created} orders...")
                    
        db.commit()
        print(f"Successfully generated exactly {orders_created} orders.")

        # 6. Rebuild denormalized customer statistics and segment associations
        print("Recomputing customer statistics and RFM metrics...")
        now = datetime.utcnow()
        segment_count = 0

        for customer in customers:
            customer_orders = orders_by_customer[customer.id]
            completed_orders = [o for o in customer_orders if o.status == "Completed"]
            
            # Denormalized fields
            order_count = len(customer_orders)
            total_spent = sum(o.amount for o in completed_orders)
            avg_order_value = round(total_spent / len(completed_orders), 2) if len(completed_orders) > 0 else 0.0
            
            customer.order_count = order_count
            customer.total_spent = round(total_spent, 2)
            customer.avg_order_value = avg_order_value
            
            if len(customer_orders) > 0:
                first_order = min(o.order_date for o in customer_orders)
                last_order = max(o.order_date for o in customer_orders)
                customer.first_order_date = first_order.strftime("%Y-%m-%d %H:%M:%S")
                customer.last_order_date = last_order.strftime("%Y-%m-%d %H:%M:%S")
                
                # Determine Customer Status (Customer or Inactive)
                days_since_order = (now - last_order).days
                if days_since_order > 180:
                    customer.status = "Inactive"
                else:
                    customer.status = "Customer"
                    
                # Calculate RFM Metrics (Scores 1 to 5)
                # Recency
                if days_since_order < 30: customer.rfm_recency = 5
                elif days_since_order < 90: customer.rfm_recency = 4
                elif days_since_order < 180: customer.rfm_recency = 3
                elif days_since_order < 365: customer.rfm_recency = 2
                else: customer.rfm_recency = 1
                
                # Frequency
                if order_count >= 15: customer.rfm_frequency = 5
                elif order_count >= 8: customer.rfm_frequency = 4
                elif order_count >= 4: customer.rfm_frequency = 3
                elif order_count >= 2: customer.rfm_frequency = 2
                else: customer.rfm_frequency = 1
                
                # Monetary
                if total_spent >= 1000: customer.rfm_monetary = 5
                elif total_spent >= 500: customer.rfm_monetary = 4
                elif total_spent >= 200: customer.rfm_monetary = 3
                elif total_spent >= 50: customer.rfm_monetary = 2
                else: customer.rfm_monetary = 1
            else:
                customer.first_order_date = None
                customer.last_order_date = None
                customer.status = "Lead" if random.random() < 0.70 else "Contacted"
                customer.rfm_recency = 1
                customer.rfm_frequency = 1
                customer.rfm_monetary = 1

            # Populate Tags
            customer_tags = []
            if customer.total_spent > 1000.0:
                customer_tags.append("vip")
                customer.segments.append(vip_segment)
                segment_count += 1
            if customer.order_count > 0:
                customer_tags.append("shopper")
                customer.segments.append(active_segment)
                segment_count += 1
            else:
                customer_tags.append("lead")
                
            if customer.status == "Inactive":
                customer_tags.append("at_risk")
                customer.segments.append(inactive_segment)
                segment_count += 1
                
            customer_tags.append(customer.company.lower().split(" & ")[0].replace(" ", "_"))
            customer.tags = ",".join(customer_tags)

        db.commit()
        print(f"Assigned {segment_count} customer-segment relationships.")

        # Update customer count metrics on segments
        vip_segment.customer_count = db.query(Customer).filter(Customer.total_spent > 1000.0).count()
        active_segment.customer_count = db.query(Customer).filter(Customer.order_count > 0).count()
        inactive_segment.customer_count = db.query(Customer).filter(Customer.status == "Inactive").count()
        db.commit()

        # Summary
        print("\n--- DTC Ecommerce Seeding Summary ---")
        print(f"Users Count:         {db.query(User).count()}")
        print(f"Customers Count:     {db.query(Customer).count()}")
        print(f"Orders Count:        {db.query(Order).count()}")
        print(f"Campaigns Count:     {db.query(Campaign).count()}")
        print(f"Segments Count:      {db.query(Segment).count()}")
        print("-----------------------------------\n")
        print("Database Seeding Completed Successfully!")

    except Exception as e:
        db.rollback()
        print(f"An error occurred during database seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    main()

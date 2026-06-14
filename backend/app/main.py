from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base
from app.api.router import api_router
from app.api.v1.endpoints.receipts import router as receipts_router
from app.api.v1.endpoints.analytics import router as analytics_router
# Import models to ensure they register on Base.metadata before creation
from app.models import models

# Create database tables automatically
Base.metadata.create_all(bind=engine)

# Auto-migrate SQLite missing columns (for Railway/persistent volume updates)
from sqlalchemy import text
if str(engine.url).startswith("sqlite"):
    with engine.begin() as conn:
        columns_to_add = [
            "ALTER TABLE campaigns ADD COLUMN segment_id INTEGER REFERENCES segments(id) ON DELETE SET NULL",
            "ALTER TABLE campaigns ADD COLUMN segment VARCHAR DEFAULT ''",
            "ALTER TABLE campaigns ADD COLUMN total_recipients INTEGER DEFAULT 0",
            "ALTER TABLE campaigns ADD COLUMN sent_count INTEGER DEFAULT 0",
            "ALTER TABLE campaigns ADD COLUMN delivered_count INTEGER DEFAULT 0",
            "ALTER TABLE campaigns ADD COLUMN opened_count INTEGER DEFAULT 0",
            "ALTER TABLE campaigns ADD COLUMN clicked_count INTEGER DEFAULT 0",
            "ALTER TABLE campaigns ADD COLUMN failed_count INTEGER DEFAULT 0",
            "ALTER TABLE campaigns ADD COLUMN revenue_attributed FLOAT DEFAULT 0.0",
            "ALTER TABLE campaigns ADD COLUMN started_at DATETIME",
            # Handle other tables if necessary
            "ALTER TABLE customers ADD COLUMN city VARCHAR",
            "ALTER TABLE customers ADD COLUMN state VARCHAR",
            "ALTER TABLE customers ADD COLUMN total_spent FLOAT DEFAULT 0.0",
            "ALTER TABLE customers ADD COLUMN order_count INTEGER DEFAULT 0",
            "ALTER TABLE customers ADD COLUMN avg_order_value FLOAT DEFAULT 0.0",
            "ALTER TABLE customers ADD COLUMN last_order_date VARCHAR",
            "ALTER TABLE customers ADD COLUMN first_order_date VARCHAR",
            "ALTER TABLE customers ADD COLUMN rfm_recency INTEGER",
            "ALTER TABLE customers ADD COLUMN rfm_frequency INTEGER",
            "ALTER TABLE customers ADD COLUMN rfm_monetary INTEGER",
            "ALTER TABLE customers ADD COLUMN tags VARCHAR"
        ]
        for query in columns_to_add:
            try:
                conn.execute(text(query))
            except Exception:
                pass

# Auto-seed database if empty on startup
from app.core.database import SessionLocal
from app.models.models import User
from app.seed import main as seed_main

db = SessionLocal()
try:
    if db.query(User).count() == 0:
        print("[Startup] Database is empty. Seeding customer, order, and user data...")
        seed_main()
        print("[Startup] Database seeding completed successfully!")
except Exception as e:
    print(f"[Startup] Error during automatic seeding check: {e}")
finally:
    db.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

from fastapi.responses import JSONResponse
import traceback

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "error": str(exc),
            "traceback": traceback.format_exc()
        }
    )

# CORS configuration to allow local frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
app.include_router(receipts_router, prefix="/api", tags=["receipts"])
app.include_router(analytics_router, prefix="/api", tags=["analytics"])



@app.get("/")
def root():
    return {"message": "Welcome to XenoPulse CRM Backend"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

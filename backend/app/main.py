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

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
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

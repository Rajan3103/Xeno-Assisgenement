from fastapi import APIRouter

from app.api.v1.endpoints import auth, customers, orders, ai, campaigns, communications, receipts, analytics

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(customers.router, prefix="/customers", tags=["customers"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(campaigns.router, prefix="/campaigns", tags=["campaigns"])
api_router.include_router(communications.router, prefix="/communications", tags=["communications"])
api_router.include_router(receipts.router, tags=["receipts"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
from app.api.v1.endpoints import products
api_router.include_router(products.router, prefix="/products", tags=["products"])



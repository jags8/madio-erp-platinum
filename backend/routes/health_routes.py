"""Health Check Endpoints"""
import httpx
from fastapi import APIRouter, Depends
from datetime import datetime
from config.whatsapp_config import whatsapp_config
from services.sharepoint_service import SharePointService

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("/")
async def health_check():
    """Basic health check - liveness probe"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "Madio ERP Platinum"
    }

@router.get("/ready")
async def readiness_check():
    """Comprehensive readiness check"""
    from database.connection import Database
    from middleware.rate_limiter import redis_client
    
    checks = {
        "database": "unknown",
        "redis": "unknown",
        "sharepoint": "unknown",
        "whatsapp": "unknown"
    }
    
    # Check MongoDB
    try:
        db = Database.get_db()
        await db.command('ping')
        checks["database"] = "healthy"
    except Exception as e:
        checks["database"] = f"unhealthy: {str(e)}"
    
    # Check Redis
    try:
        redis_client.ping()
        checks["redis"] = "healthy"
    except Exception as e:
        checks["redis"] = f"unhealthy: {str(e)}"
    
    # Check SharePoint connectivity
    try:
        sharepoint_service = SharePointService()
        await sharepoint_service._get_access_token()
        checks["sharepoint"] = "healthy"
    except Exception as e:
        checks["sharepoint"] = f"unhealthy: {str(e)}"
    
    # Check WhatsApp API
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{whatsapp_config.BASE_URL}/{whatsapp_config.PHONE_NUMBER_ID}",
                headers={"Authorization": f"Bearer {whatsapp_config.ACCESS_TOKEN}"},
                timeout=5.0
            )
            if response.status_code == 200:
                checks["whatsapp"] = "healthy"
            else:
                checks["whatsapp"] = f"unhealthy: status {response.status_code}"
    except Exception as e:
        checks["whatsapp"] = f"unhealthy: {str(e)}"
    
    all_healthy = all(
        c == "healthy" or c.startswith("healthy:") 
        for c in checks.values()
    )
    
    return {
        "status": "ready" if all_healthy else "not_ready",
        "checks": checks,
        "timestamp": datetime.now().isoformat()
    }

@router.get("/live")
async def liveness_check():
    """Kubernetes liveness probe"""
    return {"status": "alive"}

"""Health check and monitoring endpoints"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
import psutil
import platform

router = APIRouter()

class HealthStatus(BaseModel):
    status: str
    timestamp: datetime
    version: str
    environment: str

class DetailedHealthStatus(BaseModel):
    status: str
    timestamp: datetime
    version: str
    environment: str
    uptime_seconds: float
    total_requests: int
    database: dict
    system: dict

async def get_db(request) -> AsyncIOMotorDatabase:
    return request.app.state.db

@router.get("/health", response_model=HealthStatus)
async def health_check():
    """Basic health check endpoint"""
    from config import settings
    
    return HealthStatus(
        status="healthy",
        timestamp=datetime.utcnow(),
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT
    )

@router.get("/health/detailed", response_model=DetailedHealthStatus)
async def detailed_health_check(request):
    """Detailed health check with system and database metrics"""
    from config import settings
    
    db = request.app.state.db
    lifecycle = request.app.state.lifecycle
    
    # Calculate uptime
    uptime_seconds = (datetime.utcnow() - lifecycle.startup_time).total_seconds()
    
    # Check database
    try:
        await db.command('ping')
        db_status = "connected"
        
        # Get database stats
        stats = await db.command('dbStats')
        db_info = {
            "status": db_status,
            "collections": stats.get('collections', 0),
            "data_size_mb": round(stats.get('dataSize', 0) / (1024 * 1024), 2),
            "indexes": stats.get('indexes', 0)
        }
    except Exception as e:
        db_info = {
            "status": "error",
            "error": str(e)
        }
    
    # Get system info
    system_info = {
        "cpu_percent": psutil.cpu_percent(interval=1),
        "memory_percent": psutil.virtual_memory().percent,
        "disk_percent": psutil.disk_usage('/').percent,
        "platform": platform.platform(),
        "python_version": platform.python_version()
    }
    
    return DetailedHealthStatus(
        status="healthy",
        timestamp=datetime.utcnow(),
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT,
        uptime_seconds=uptime_seconds,
        total_requests=lifecycle.request_count,
        database=db_info,
        system=system_info
    )

@router.get("/health/ready")
async def readiness_check(request):
    """Kubernetes readiness probe"""
    try:
        db = request.app.state.db
        await db.command('ping')
        return {"status": "ready"}
    except:
        return {"status": "not_ready"}, 503

@router.get("/health/live")
async def liveness_check():
    """Kubernetes liveness probe"""
    return {"status": "alive"}

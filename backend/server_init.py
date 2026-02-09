"""Server initialization and startup/shutdown handlers"""
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import time
import uuid
from datetime import datetime

from config import settings
from utils.logger import app_logger
from utils.db_indexes import create_database_indexes
from utils.exceptions import (
    business_logic_error_handler,
    resource_not_found_error_handler,
    validation_error_handler,
    generic_error_handler,
    BusinessLogicError,
    ResourceNotFoundError
)
from fastapi.exceptions import RequestValidationError
from middleware.rate_limiter import rate_limiter

class ServerLifecycle:
    """Manage server lifecycle events"""
    
    def __init__(self, app: FastAPI, db_client: AsyncIOMotorClient):
        self.app = app
        self.db_client = db_client
        self.startup_time = None
        self.request_count = 0
        
    async def startup_handler(self):
        """Execute on server startup"""
        self.startup_time = datetime.utcnow()
        app_logger.logger.info(
            f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}",
            extra={
                "environment": settings.ENVIRONMENT,
                "log_level": settings.LOG_LEVEL
            }
        )
        
        try:
            # Test database connection
            await self.db_client.admin.command('ping')
            app_logger.logger.info("✅ Database connection established")
            
            # Create indexes
            db = self.db_client[settings.DB_NAME]
            await create_database_indexes(db)
            
            app_logger.logger.info("✅ Server initialization complete")
            
        except Exception as e:
            app_logger.log_error(e, context={"phase": "startup"})
            raise
    
    async def shutdown_handler(self):
        """Execute on server shutdown"""
        app_logger.logger.info(
            f"🛑 Shutting down {settings.APP_NAME}",
            extra={"total_requests": self.request_count}
        )
        
        # Close database connection
        self.db_client.close()
        app_logger.logger.info("✅ Database connection closed")
        app_logger.logger.info("✅ Shutdown complete")

def setup_middleware(app: FastAPI, lifecycle: ServerLifecycle):
    """Configure all middleware"""
    
    # CORS Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Request Timing & Logging Middleware
    @app.middleware("http")
    async def logging_middleware(request: Request, call_next):
        # Add request ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        # Start timer
        start_time = time.time()
        
        # Log request
        app_logger.log_api_request(
            method=request.method,
            path=request.url.path,
            user_id=getattr(request.state, "user_id", None),
            request_id=request_id
        )
        
        # Process request
        try:
            response = await call_next(request)
        except Exception as e:
            app_logger.log_error(e, context={
                "method": request.method,
                "path": request.url.path,
                "request_id": request_id
            })
            raise
        
        # Calculate duration
        duration_ms = (time.time() - start_time) * 1000
        
        # Log response
        app_logger.log_api_response(
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration_ms=duration_ms,
            request_id=request_id
        )
        
        # Add custom headers
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time"] = f"{duration_ms:.2f}ms"
        
        # Increment request counter
        lifecycle.request_count += 1
        
        return response
    
    # Rate Limiting Middleware
    @app.middleware("http")
    async def rate_limit_middleware(request: Request, call_next):
        # Skip rate limiting for health checks
        if request.url.path in ["/health", "/api/health"]:
            return await call_next(request)
        
        try:
            await rate_limiter.check_rate_limit(request)
        except Exception as rate_limit_error:
            return JSONResponse(
                status_code=429,
                content={
                    "error": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": str(rate_limit_error)
                    }
                }
            )
        
        return await call_next(request)

def setup_exception_handlers(app: FastAPI):
    """Register custom exception handlers"""
    app.add_exception_handler(BusinessLogicError, business_logic_error_handler)
    app.add_exception_handler(ResourceNotFoundError, resource_not_found_error_handler)
    app.add_exception_handler(RequestValidationError, validation_error_handler)
    app.add_exception_handler(Exception, generic_error_handler)

def create_application() -> FastAPI:
    """Create and configure FastAPI application"""
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="Comprehensive ERP/CRM for multi-division businesses",
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None
    )
    
    # Create database client
    db_client = AsyncIOMotorClient(settings.MONGO_URL)
    
    # Setup lifecycle
    lifecycle = ServerLifecycle(app, db_client)
    
    # Register event handlers
    app.add_event_handler("startup", lifecycle.startup_handler)
    app.add_event_handler("shutdown", lifecycle.shutdown_handler)
    
    # Setup middleware
    setup_middleware(app, lifecycle)
    
    # Setup exception handlers
    setup_exception_handlers(app)
    
    # Store db client for route access
    app.state.db = db_client[settings.DB_NAME]
    app.state.lifecycle = lifecycle
    
    return app

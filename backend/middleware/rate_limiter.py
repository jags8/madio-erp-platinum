"""Rate Limiting Middleware with Redis"""
import os
import time
from fastapi import Request, HTTPException
from redis import Redis
from typing import Callable

redis_client = Redis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    db=0,
    decode_responses=True,
    password=os.getenv("REDIS_PASSWORD", None)
)

class RateLimiter:
    """Rate limiting middleware using sliding window"""
    
    def __init__(self, requests: int = 100, window: int = 60):
        """
        Args:
            requests: Maximum number of requests allowed
            window: Time window in seconds
        """
        self.requests = requests
        self.window = window
    
    async def __call__(self, request: Request, call_next: Callable):
        """Process request with rate limiting"""
        
        # Skip rate limiting for health checks
        if request.url.path in ["/health", "/ready", "/metrics"]:
            return await call_next(request)
        
        # Use IP address or user ID as key
        identifier = request.client.host
        if hasattr(request.state, "user"):
            identifier = request.state.user.get("id", identifier)
        
        key = f"rate_limit:{identifier}:{int(time.time() / self.window)}"
        
        try:
            # Increment counter
            current = redis_client.incr(key)
            
            if current == 1:
                redis_client.expire(key, self.window)
            
            if current > self.requests:
                raise HTTPException(
                    status_code=429,
                    detail=f"Rate limit exceeded. Max {self.requests} requests per {self.window} seconds."
                )
            
            # Process request
            response = await call_next(request)
            
            # Add rate limit headers
            response.headers["X-RateLimit-Limit"] = str(self.requests)
            response.headers["X-RateLimit-Remaining"] = str(max(0, self.requests - current))
            response.headers["X-RateLimit-Reset"] = str(int(time.time()) + self.window)
            
            return response
            
        except Exception as e:
            if isinstance(e, HTTPException):
                raise
            # If Redis fails, allow request through
            return await call_next(request)

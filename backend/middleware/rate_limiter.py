"""Rate limiting middleware to prevent API abuse"""
from fastapi import Request, HTTPException
from datetime import datetime, timedelta
from collections import defaultdict
import asyncio
from typing import Dict, Tuple

class RateLimiter:
    """Token bucket rate limiter"""
    
    def __init__(self, requests_per_minute: int = 60, requests_per_hour: int = 1000):
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour
        self.minute_buckets: Dict[str, list] = defaultdict(list)
        self.hour_buckets: Dict[str, list] = defaultdict(list)
        self.lock = asyncio.Lock()
    
    async def check_rate_limit(self, request: Request) -> bool:
        """Check if request exceeds rate limits"""
        # Get client identifier (IP + user)
        client_id = self._get_client_id(request)
        now = datetime.utcnow()
        
        async with self.lock:
            # Clean old entries
            self._clean_old_entries(client_id, now)
            
            # Check minute limit
            minute_requests = len(self.minute_buckets[client_id])
            if minute_requests >= self.requests_per_minute:
                raise HTTPException(
                    status_code=429,
                    detail="Too many requests. Please try again in a minute."
                )
            
            # Check hour limit
            hour_requests = len(self.hour_buckets[client_id])
            if hour_requests >= self.requests_per_hour:
                raise HTTPException(
                    status_code=429,
                    detail="Hourly rate limit exceeded. Please try again later."
                )
            
            # Add current request
            self.minute_buckets[client_id].append(now)
            self.hour_buckets[client_id].append(now)
            
            return True
    
    def _get_client_id(self, request: Request) -> str:
        """Generate unique client identifier"""
        ip = request.client.host if request.client else "unknown"
        user_id = getattr(request.state, "user_id", "anonymous")
        return f"{ip}:{user_id}"
    
    def _clean_old_entries(self, client_id: str, now: datetime):
        """Remove expired rate limit entries"""
        minute_ago = now - timedelta(minutes=1)
        hour_ago = now - timedelta(hours=1)
        
        # Clean minute bucket
        self.minute_buckets[client_id] = [
            ts for ts in self.minute_buckets[client_id] if ts > minute_ago
        ]
        
        # Clean hour bucket
        self.hour_buckets[client_id] = [
            ts for ts in self.hour_buckets[client_id] if ts > hour_ago
        ]
        
        # Remove empty buckets
        if not self.minute_buckets[client_id]:
            del self.minute_buckets[client_id]
        if not self.hour_buckets[client_id]:
            del self.hour_buckets[client_id]

# Global rate limiter instance
rate_limiter = RateLimiter()

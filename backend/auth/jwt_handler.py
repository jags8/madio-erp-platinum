"""JWT Authentication Handler with Refresh Token Support"""
import os
import secrets
from datetime import datetime, timedelta
from typing import Optional, Tuple
from jose import JWTError, jwt
from bson import ObjectId

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
REFRESH_SECRET_KEY = os.getenv("JWT_REFRESH_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

async def create_token_pair(user_id: str, role: str) -> Tuple[str, str]:
    """Create access and refresh token pair"""
    from database import Database
    db = Database.get_db()
    
    # Access token - short lived
    access_payload = {
        "sub": user_id,
        "role": role,
        "type": "access",
        "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        "iat": datetime.utcnow()
    }
    access_token = jwt.encode(access_payload, SECRET_KEY, algorithm=ALGORITHM)
    
    # Refresh token - long lived with jti for revocation
    refresh_jti = secrets.token_urlsafe(32)
    refresh_payload = {
        "sub": user_id,
        "type": "refresh",
        "jti": refresh_jti,
        "exp": datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        "iat": datetime.utcnow()
    }
    refresh_token = jwt.encode(refresh_payload, REFRESH_SECRET_KEY, algorithm=ALGORITHM)
    
    # Store refresh token in database for revocation capability
    await db.refresh_tokens.insert_one({
        "jti": refresh_jti,
        "user_id": user_id,
        "expires_at": datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        "created_at": datetime.utcnow(),
        "revoked": False
    })
    
    return access_token, refresh_token

async def refresh_access_token(refresh_token: str) -> Optional[str]:
    """Generate new access token from refresh token"""
    from database import Database
    db = Database.get_db()
    
    try:
        payload = jwt.decode(refresh_token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
        
        if payload.get("type") != "refresh":
            return None
        
        # Check if refresh token is revoked
        token_record = await db.refresh_tokens.find_one({
            "jti": payload.get("jti"),
            "revoked": False
        })
        
        if not token_record:
            return None
        
        # Generate new access token
        user = await db.users.find_one({"_id": ObjectId(payload.get("sub"))})
        if not user:
            return None
        
        access_payload = {
            "sub": str(user["_id"]),
            "role": user.get("role", "staff"),
            "type": "access",
            "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
            "iat": datetime.utcnow()
        }
        
        return jwt.encode(access_payload, SECRET_KEY, algorithm=ALGORITHM)
        
    except JWTError:
        return None

async def revoke_refresh_token(jti: str) -> bool:
    """Revoke a refresh token"""
    from database import Database
    db = Database.get_db()
    
    result = await db.refresh_tokens.update_one(
        {"jti": jti},
        {"$set": {"revoked": True, "revoked_at": datetime.utcnow()}}
    )
    
    return result.modified_count > 0

async def verify_token(token: str) -> Optional[dict]:
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "access":
            return None
        return payload
    except JWTError:
        return None

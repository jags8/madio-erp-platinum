"""Input validation middleware for request data"""
from fastapi import Request, HTTPException
from typing import Optional
import re
from datetime import datetime

class ValidationError(HTTPException):
    def __init__(self, field: str, message: str):
        super().__init__(
            status_code=422,
            detail={"field": field, "message": message}
        )

class InputValidator:
    """Centralized input validation"""
    
    @staticmethod
    def validate_phone(phone: str) -> bool:
        """Validate Indian phone number"""
        pattern = r'^(\+91)?[6-9]\d{9}$'
        return bool(re.match(pattern, phone))
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))
    
    @staticmethod
    def validate_gstin(gstin: str) -> bool:
        """Validate GSTIN format"""
        pattern = r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'
        return bool(re.match(pattern, gstin))
    
    @staticmethod
    def validate_pincode(pincode: str) -> bool:
        """Validate Indian pincode"""
        pattern = r'^[1-9][0-9]{5}$'
        return bool(re.match(pattern, pincode))
    
    @staticmethod
    def sanitize_string(value: str, max_length: int = 500) -> str:
        """Sanitize string input to prevent injection"""
        if not value:
            return ""
        # Remove potential script tags and limit length
        sanitized = re.sub(r'<[^>]*?>', '', value)
        return sanitized[:max_length].strip()
    
    @staticmethod
    def validate_date_range(start_date: datetime, end_date: datetime) -> bool:
        """Validate date range is logical"""
        if not start_date or not end_date:
            return True
        return start_date <= end_date
    
    @staticmethod
    def validate_amount(amount: float, min_val: float = 0, max_val: float = 100000000) -> bool:
        """Validate monetary amounts"""
        return min_val <= amount <= max_val
    
    @staticmethod
    def validate_quantity(qty: float, min_val: float = 0) -> bool:
        """Validate quantity values"""
        return qty >= min_val

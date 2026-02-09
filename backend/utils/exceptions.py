"""Custom exception handlers for the application"""
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
import logging

logger = logging.getLogger(__name__)

class BusinessLogicError(Exception):
    """Base exception for business logic errors"""
    def __init__(self, message: str, code: str = "BUSINESS_ERROR"):
        self.message = message
        self.code = code
        super().__init__(self.message)

class ResourceNotFoundError(BusinessLogicError):
    """Resource not found in database"""
    def __init__(self, resource: str, identifier: str):
        super().__init__(
            message=f"{resource} with id '{identifier}' not found",
            code="RESOURCE_NOT_FOUND"
        )
        self.resource = resource
        self.identifier = identifier

class InsufficientPermissionError(BusinessLogicError):
    """User lacks required permissions"""
    def __init__(self, action: str, required_roles: list):
        super().__init__(
            message=f"Insufficient permissions for {action}. Required roles: {', '.join(required_roles)}",
            code="INSUFFICIENT_PERMISSION"
        )

class InsufficientInventoryError(BusinessLogicError):
    """Insufficient inventory for operation"""
    def __init__(self, item_name: str, requested: float, available: float):
        super().__init__(
            message=f"Insufficient inventory for {item_name}. Requested: {requested}, Available: {available}",
            code="INSUFFICIENT_INVENTORY"
        )

class InvalidOperationError(BusinessLogicError):
    """Operation not allowed in current state"""
    def __init__(self, operation: str, reason: str):
        super().__init__(
            message=f"Cannot {operation}: {reason}",
            code="INVALID_OPERATION"
        )

async def business_logic_error_handler(request: Request, exc: BusinessLogicError):
    """Handle business logic errors"""
    logger.warning(f"Business logic error: {exc.message}", extra={"code": exc.code})
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message
            }
        }
    )

async def resource_not_found_error_handler(request: Request, exc: ResourceNotFoundError):
    """Handle resource not found errors"""
    logger.info(f"Resource not found: {exc.resource} - {exc.identifier}")
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "resource": exc.resource,
                "identifier": exc.identifier
            }
        }
    )

async def validation_error_handler(request: Request, exc: RequestValidationError):
    """Handle Pydantic validation errors"""
    errors = []
    for error in exc.errors():
        errors.append({
            "field": ".".join(str(x) for x in error["loc"]),
            "message": error["msg"],
            "type": error["type"]
        })
    
    logger.warning(f"Validation error: {errors}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Request validation failed",
                "details": errors
            }
        }
    )

async def generic_error_handler(request: Request, exc: Exception):
    """Handle unexpected errors"""
    logger.error(f"Unexpected error: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred. Please try again later."
            }
        }
    )

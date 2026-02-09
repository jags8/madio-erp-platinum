"""Structured logging configuration for production"""
import logging
import sys
from datetime import datetime
import json
from typing import Any, Dict

class StructuredLogger:
    """JSON-formatted structured logger for production monitoring"""
    
    def __init__(self, name: str, level: int = logging.INFO):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(level)
        
        # Remove existing handlers
        self.logger.handlers.clear()
        
        # Create console handler with structured format
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(level)
        
        # Set formatter
        formatter = StructuredFormatter()
        handler.setFormatter(formatter)
        
        self.logger.addHandler(handler)
    
    def log_api_request(self, method: str, path: str, user_id: str = None, **kwargs):
        """Log API request details"""
        self.logger.info(
            "API Request",
            extra={
                "event_type": "api_request",
                "method": method,
                "path": path,
                "user_id": user_id,
                **kwargs
            }
        )
    
    def log_api_response(self, method: str, path: str, status_code: int, duration_ms: float, **kwargs):
        """Log API response details"""
        self.logger.info(
            "API Response",
            extra={
                "event_type": "api_response",
                "method": method,
                "path": path,
                "status_code": status_code,
                "duration_ms": duration_ms,
                **kwargs
            }
        )
    
    def log_db_operation(self, operation: str, collection: str, duration_ms: float = None, **kwargs):
        """Log database operations"""
        self.logger.info(
            "DB Operation",
            extra={
                "event_type": "db_operation",
                "operation": operation,
                "collection": collection,
                "duration_ms": duration_ms,
                **kwargs
            }
        )
    
    def log_error(self, error: Exception, context: Dict[str, Any] = None):
        """Log error with context"""
        self.logger.error(
            str(error),
            extra={
                "event_type": "error",
                "error_type": type(error).__name__,
                "error_message": str(error),
                "context": context or {}
            },
            exc_info=True
        )

class StructuredFormatter(logging.Formatter):
    """Custom formatter that outputs JSON-structured logs"""
    
    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        
        # Add extra fields
        if hasattr(record, "event_type"):
            log_data["event_type"] = record.event_type
        
        # Add all custom fields from extra
        for key, value in record.__dict__.items():
            if key not in ['name', 'msg', 'args', 'created', 'filename', 'funcName',
                          'levelname', 'levelno', 'lineno', 'module', 'msecs',
                          'message', 'pathname', 'process', 'processName',
                          'relativeCreated', 'thread', 'threadName', 'exc_info',
                          'exc_text', 'stack_info']:
                log_data[key] = value
        
        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        return json.dumps(log_data)

# Global logger instance
app_logger = StructuredLogger("bizflow_crm")

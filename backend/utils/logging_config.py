"""Structured Logging Configuration"""
import logging
import logging.handlers
import os
from datetime import datetime
from pythonjsonlogger import jsonlogger

class CustomJsonFormatter(jsonlogger.JsonFormatter):
    """Custom JSON formatter for structured logging"""
    
    def add_fields(self, log_record, record, message_dict):
        super().add_fields(log_record, record, message_dict)
        
        log_record['timestamp'] = datetime.utcnow().isoformat()
        log_record['level'] = record.levelname
        log_record['logger'] = record.name
        log_record['service'] = 'madio-erp-backend'
        
        if hasattr(record, 'user_id'):
            log_record['user_id'] = record.user_id
        
        if hasattr(record, 'request_id'):
            log_record['request_id'] = record.request_id

def setup_logging():
    """Configure application logging"""
    
    # Root logger
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    
    # Console handler with JSON format
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(CustomJsonFormatter(
        '%(timestamp)s %(level)s %(name)s %(message)s'
    ))
    logger.addHandler(console_handler)
    
    # File handler with rotation (if in production)
    if os.getenv("ENVIRONMENT") == "production":
        os.makedirs('/var/log/madio-erp', exist_ok=True)
        
        file_handler = logging.handlers.RotatingFileHandler(
            '/var/log/madio-erp/application.log',
            maxBytes=10485760,  # 10MB
            backupCount=10
        )
        file_handler.setFormatter(CustomJsonFormatter())
        logger.addHandler(file_handler)
        
        # Error file handler
        error_handler = logging.handlers.RotatingFileHandler(
            '/var/log/madio-erp/errors.log',
            maxBytes=10485760,
            backupCount=5
        )
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(CustomJsonFormatter())
        logger.addHandler(error_handler)
    
    return logger

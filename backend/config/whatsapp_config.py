"""WhatsApp Business API Configuration"""
import os
from pydantic import BaseModel

class WhatsAppConfig(BaseModel):
    """WhatsApp Business API Configuration"""
    
    # WhatsApp Cloud API credentials
    PHONE_NUMBER_ID: str = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
    BUSINESS_ACCOUNT_ID: str = os.getenv("WHATSAPP_BUSINESS_ACCOUNT_ID", "")
    ACCESS_TOKEN: str = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
    WEBHOOK_VERIFY_TOKEN: str = os.getenv("WHATSAPP_WEBHOOK_VERIFY_TOKEN", "")
    API_VERSION: str = "v21.0"
    BASE_URL: str = f"https://graph.facebook.com/{API_VERSION}"
    
    # SharePoint configuration
    SHAREPOINT_TENANT_ID: str = os.getenv("SHAREPOINT_TENANT_ID", "")
    SHAREPOINT_CLIENT_ID: str = os.getenv("SHAREPOINT_CLIENT_ID", "")
    SHAREPOINT_CLIENT_SECRET: str = os.getenv("SHAREPOINT_CLIENT_SECRET", "")
    SHAREPOINT_SITE_ID: str = os.getenv("SHAREPOINT_SITE_ID", "")
    SHAREPOINT_ROOT_FOLDER: str = "/Madio ERP/WhatsApp Media"
    
    # Media settings
    MAX_IMAGE_SIZE_MB: int = 5
    MAX_VIDEO_SIZE_MB: int = 16
    MAX_DOCUMENT_SIZE_MB: int = 100
    ALLOWED_IMAGE_TYPES: list = [".jpg", ".jpeg", ".png", ".webp"]
    ALLOWED_VIDEO_TYPES: list = [".mp4", ".3gp"]
    ALLOWED_DOCUMENT_TYPES: list = [".pdf", ".doc", ".docx", ".xls", ".xlsx"]

whatsapp_config = WhatsAppConfig()

"""WhatsApp Business API Integration Service"""
import httpx
from typing import Optional, Dict, Any
from datetime import datetime
from bson import ObjectId

from config.whatsapp_config import whatsapp_config
from services.sharepoint_service import SharePointService

class WhatsAppService:
    """WhatsApp Business API Integration Service"""
    
    def __init__(self):
        self.config = whatsapp_config
        self.sharepoint = SharePointService()
        self.base_url = f"{self.config.BASE_URL}/{self.config.PHONE_NUMBER_ID}"
    
    async def send_text_message(
        self, 
        to_phone: str, 
        message: str,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send text message via WhatsApp"""
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/messages",
                headers={
                    "Authorization": f"Bearer {self.config.ACCESS_TOKEN}",
                    "Content-Type": "application/json"
                },
                json={
                    "messaging_product": "whatsapp",
                    "recipient_type": "individual",
                    "to": to_phone,
                    "type": "text",
                    "text": {"body": message}
                }
            )
            
            response_data = response.json()
            
            if response.status_code == 200:
                # Store message in database
                await self._store_message(
                    whatsapp_message_id=response_data["messages"][0]["id"],
                    to_phone=to_phone,
                    from_phone=self.config.PHONE_NUMBER_ID,
                    from_user_id=user_id,
                    message_type="text",
                    message_body=message,
                    direction="outbound",
                    status="sent"
                )
            
            return response_data
    
    async def send_media_message(
        self,
        to_phone: str,
        media_url: str,
        media_type: str,
        caption: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send media message via WhatsApp"""
        
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to_phone,
            "type": media_type,
            media_type: {
                "link": media_url
            }
        }
        
        if caption and media_type in ["image", "video"]:
            payload[media_type]["caption"] = caption
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/messages",
                headers={
                    "Authorization": f"Bearer {self.config.ACCESS_TOKEN}",
                    "Content-Type": "application/json"
                },
                json=payload
            )
            
            return response.json()
    
    async def download_media(self, media_id: str) -> bytes:
        """Download media from WhatsApp"""
        
        async with httpx.AsyncClient() as client:
            # Get media URL
            media_response = await client.get(
                f"{self.config.BASE_URL}/{media_id}",
                headers={"Authorization": f"Bearer {self.config.ACCESS_TOKEN}"}
            )
            
            media_data = media_response.json()
            media_url = media_data.get("url")
            
            # Download media content
            content_response = await client.get(
                media_url,
                headers={"Authorization": f"Bearer {self.config.ACCESS_TOKEN}"}
            )
            
            return content_response.content
    
    async def process_incoming_message(
        self, 
        webhook_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Process incoming WhatsApp webhook message"""
        
        entry = webhook_data.get("entry", [])[0]
        changes = entry.get("changes", [])[0]
        value = changes.get("value", {})
        messages = value.get("messages", [])
        
        if not messages:
            return {"status": "no_messages"}
        
        message = messages[0]
        message_id = message.get("id")
        from_phone = message.get("from")
        message_type = message.get("type")
        timestamp = datetime.fromtimestamp(int(message.get("timestamp")))
        
        result = {
            "message_id": message_id,
            "from_phone": from_phone,
            "type": message_type,
            "timestamp": timestamp
        }
        
        # Handle different message types
        if message_type == "text":
            result["text"] = message.get("text", {}).get("body")
        
        elif message_type in ["image", "video", "document"]:
            media = message.get(message_type, {})
            media_id = media.get("id")
            filename = media.get("filename", f"{message_type}_{message_id}")
            
            # Download and upload to SharePoint
            media_content = await self.download_media(media_id)
            
            sharepoint_result = await self.sharepoint.upload_file(
                file_content=media_content,
                filename=filename,
                folder_path=f"{self.config.SHAREPOINT_ROOT_FOLDER}/General",
                metadata={
                    "whatsapp_message_id": message_id,
                    "sender_phone": from_phone,
                    "received_at": timestamp.isoformat()
                }
            )
            
            result["media"] = {
                "media_id": media_id,
                "filename": filename,
                "sharepoint_url": sharepoint_result["web_url"]
            }
        
        return result
    
    async def _store_message(self, **kwargs) -> str:
        """Store message in database"""
        from database import Database
        db = Database.get_db()
        
        doc = {
            **kwargs,
            "created_at": datetime.now()
        }
        
        result = await db.whatsapp_messages.insert_one(doc)
        return str(result.inserted_id)

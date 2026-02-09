"""WhatsApp API Routes"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from typing import Optional, List
from datetime import datetime, timedelta
from bson import ObjectId
from pydantic import BaseModel

from services.whatsapp_service import WhatsAppService
from auth.jwt_handler import verify_token
from database.connection import Database

router = APIRouter(prefix="/api/whatsapp", tags=["WhatsApp"])
whatsapp_service = WhatsAppService()

class SendMessageRequest(BaseModel):
    to_phone: str
    message: str
    link_to_entity: Optional[str] = None
    entity_type: Optional[str] = None  # project, petty_cash, lead

class SendMediaRequest(BaseModel):
    to_phone: str
    media_url: str
    media_type: str  # image, video, document
    caption: Optional[str] = None
    link_to_entity: Optional[str] = None
    entity_type: Optional[str] = None

class ConversationResponse(BaseModel):
    conversation_id: str
    other_party: str
    last_message: dict
    unread_count: int
    created_at: datetime

async def get_current_user(request: Request):
    """Dependency to get current authenticated user"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = auth_header.replace("Bearer ", "")
    payload = await verify_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return payload

@router.post("/send-message")
async def send_message(
    request: SendMessageRequest,
    current_user: dict = Depends(get_current_user)
):
    """Send text message via WhatsApp"""
    try:
        result = await whatsapp_service.send_text_message(
            to_phone=request.to_phone,
            message=request.message,
            user_id=current_user.get("sub")
        )
        
        # Link message to entity if provided
        if request.link_to_entity and request.entity_type:
            db = Database.get_db()
            await db.whatsapp_entity_links.insert_one({
                "message_id": result["messages"][0]["id"],
                "entity_id": request.link_to_entity,
                "entity_type": request.entity_type,
                "created_at": datetime.now()
            })
        
        return {
            "success": True,
            "message_id": result["messages"][0]["id"],
            "status": "sent"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/send-media")
async def send_media(
    request: SendMediaRequest,
    current_user: dict = Depends(get_current_user)
):
    """Send media message via WhatsApp"""
    try:
        result = await whatsapp_service.send_media_message(
            to_phone=request.to_phone,
            media_url=request.media_url,
            media_type=request.media_type,
            caption=request.caption,
            user_id=current_user.get("sub")
        )
        
        return {
            "success": True,
            "message_id": result["messages"][0]["id"],
            "status": "sent"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/conversations")
async def get_conversations(
    current_user: dict = Depends(get_current_user)
):
    """Get all WhatsApp conversations"""
    db = Database.get_db()
    
    # Aggregate conversations from messages
    pipeline = [
        {
            "$sort": {"created_at": -1}
        },
        {
            "$group": {
                "_id": "$other_party",
                "last_message": {"$first": "$$ROOT"},
                "unread_count": {
                    "$sum": {
                        "$cond": [
                            {"$and": [
                                {"$eq": ["$direction", "inbound"]},
                                {"$eq": ["$read", False]}
                            ]},
                            1,
                            0
                        ]
                    }
                },
                "created_at": {"$first": "$created_at"}
            }
        },
        {
            "$project": {
                "conversation_id": "$_id",
                "other_party": "$_id",
                "last_message": {
                    "id": {"$toString": "$last_message._id"},
                    "type": "$last_message.message_type",
                    "text": "$last_message.message_body",
                    "timestamp": "$last_message.created_at",
                    "direction": "$last_message.direction"
                },
                "unread_count": 1,
                "created_at": 1,
                "_id": 0
            }
        },
        {
            "$sort": {"last_message.timestamp": -1}
        }
    ]
    
    conversations = await db.whatsapp_messages.aggregate(pipeline).to_list(100)
    
    return conversations

@router.get("/conversation/{phone_number}")
async def get_conversation_messages(
    phone_number: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all messages in a conversation"""
    db = Database.get_db()
    
    messages = await db.whatsapp_messages.find({
        "other_party": phone_number
    }).sort("created_at", 1).to_list(1000)
    
    # Mark inbound messages as read
    await db.whatsapp_messages.update_many(
        {
            "other_party": phone_number,
            "direction": "inbound",
            "read": False
        },
        {
            "$set": {"read": True, "read_at": datetime.now()}
        }
    )
    
    # Format messages for frontend
    formatted_messages = []
    for msg in messages:
        formatted_messages.append({
            "id": str(msg["_id"]),
            "type": msg.get("message_type", "text"),
            "body": msg.get("message_body"),
            "direction": msg.get("direction"),
            "status": msg.get("status", "sent"),
            "timestamp": msg.get("created_at"),
            "media_url": msg.get("media_url"),
            "from_user": str(msg.get("from_user_id")) if msg.get("from_user_id") else None
        })
    
    return formatted_messages

@router.post("/webhook")
async def whatsapp_webhook(request: Request):
    """Handle incoming WhatsApp webhooks"""
    from config.whatsapp_config import whatsapp_config
    
    # Verify webhook (first time setup)
    if request.method == "GET":
        params = request.query_params
        mode = params.get("hub.mode")
        token = params.get("hub.verify_token")
        challenge = params.get("hub.challenge")
        
        if mode == "subscribe" and token == whatsapp_config.WEBHOOK_VERIFY_TOKEN:
            return int(challenge)
        else:
            raise HTTPException(status_code=403, detail="Invalid verification token")
    
    # Process incoming message
    body = await request.json()
    
    try:
        result = await whatsapp_service.process_incoming_message(body)
        
        # Store in database
        db = Database.get_db()
        
        message_doc = {
            "whatsapp_message_id": result["message_id"],
            "from_phone": result["from_phone"],
            "other_party": result["from_phone"],
            "to_phone": whatsapp_config.PHONE_NUMBER_ID,
            "message_type": result["type"],
            "message_body": result.get("text"),
            "direction": "inbound",
            "status": "received",
            "read": False,
            "created_at": result["timestamp"],
            "media_url": result.get("media", {}).get("sharepoint_url")
        }
        
        await db.whatsapp_messages.insert_one(message_doc)
        
        return {"status": "success"}
        
    except Exception as e:
        print(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}

@router.get("/entity-messages/{entity_type}/{entity_id}")
async def get_entity_messages(
    entity_type: str,
    entity_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all WhatsApp messages linked to a specific entity"""
    db = Database.get_db()
    
    # Find all message links for this entity
    links = await db.whatsapp_entity_links.find({
        "entity_type": entity_type,
        "entity_id": entity_id
    }).to_list(1000)
    
    message_ids = [link["message_id"] for link in links]
    
    # Get messages
    messages = await db.whatsapp_messages.find({
        "whatsapp_message_id": {"$in": message_ids}
    }).sort("created_at", -1).to_list(1000)
    
    return [{
        "id": str(msg["_id"]),
        "type": msg.get("message_type"),
        "body": msg.get("message_body"),
        "direction": msg.get("direction"),
        "timestamp": msg.get("created_at"),
        "phone": msg.get("other_party")
    } for msg in messages]

@router.post("/upload-temp")
async def upload_temp_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload temporary file for WhatsApp media sending"""
    import uuid
    import os
    
    # Create temp directory if not exists
    os.makedirs("/tmp/whatsapp-uploads", exist_ok=True)
    
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = f"/tmp/whatsapp-uploads/{unique_filename}"
    
    # Save file
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # Return publicly accessible URL (you need to configure this)
    # For production, upload to S3/Azure Blob and return public URL
    base_url = os.getenv("API_BASE_URL", "http://localhost:8000")
    
    return {
        "url": f"{base_url}/temp-media/{unique_filename}",
        "filename": file.filename
    }

@router.get("/stats")
async def get_whatsapp_stats(
    days: int = 30,
    current_user: dict = Depends(get_current_user)
):
    """Get WhatsApp usage statistics"""
    db = Database.get_db()
    
    start_date = datetime.now() - timedelta(days=days)
    
    pipeline = [
        {
            "$match": {
                "created_at": {"$gte": start_date}
            }
        },
        {
            "$group": {
                "_id": {
                    "direction": "$direction",
                    "type": "$message_type"
                },
                "count": {"$sum": 1}
            }
        }
    ]
    
    stats = await db.whatsapp_messages.aggregate(pipeline).to_list(100)
    
    # Total messages
    total_messages = await db.whatsapp_messages.count_documents({
        "created_at": {"$gte": start_date}
    })
    
    # Unique conversations
    unique_conversations = len(await db.whatsapp_messages.distinct(
        "other_party",
        {"created_at": {"$gte": start_date}}
    ))
    
    return {
        "total_messages": total_messages,
        "unique_conversations": unique_conversations,
        "breakdown": stats,
        "period_days": days
    }

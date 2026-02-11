#!/usr/bin/env python3
"""Initialize WhatsApp Chat Database Schema"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi
from dotenv import load_dotenv

load_dotenv()

async def init_database():
    """Initialize database collections and indexes for WhatsApp chat"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(
        os.getenv("MONGODB_URI"),
        server_api=ServerApi('1')
    )
    
    db = client[os.getenv("MONGODB_DATABASE", "madio_erp")]
    
    print("📦 Initializing WhatsApp Chat Database Schema...\n")
    
    # Create whatsapp_messages collection
    print("Creating whatsapp_messages collection...")
    try:
        await db.create_collection("whatsapp_messages")
        print("✅ Collection created")
    except Exception as e:
        print(f"⚠️  Collection exists or error: {e}")
    
    # Create indexes for whatsapp_messages
    print("\nCreating indexes for whatsapp_messages...")
    
    indexes = [
        {"keys": [("whatsapp_message_id", 1)], "unique": True, "name": "whatsapp_message_id_1"},
        {"keys": [("other_party", 1), ("created_at", -1)], "name": "conversation_messages"},
        {"keys": [("direction", 1), ("status", 1)], "name": "message_status"},
        {"keys": [("created_at", -1)], "name": "created_at_desc"},
        {"keys": [("from_user_id", 1), ("created_at", -1)], "name": "user_messages"},
        {"keys": [("read", 1), ("direction", 1)], "name": "unread_inbound"}
    ]
    
    for index_spec in indexes:
        try:
            await db.whatsapp_messages.create_index(
                index_spec["keys"],
                unique=index_spec.get("unique", False),
                name=index_spec["name"]
            )
            print(f"✅ Created index: {index_spec['name']}")
        except Exception as e:
            print(f"⚠️  Index exists or error: {index_spec['name']}")
    
    # Create whatsapp_entity_links collection
    print("\nCreating whatsapp_entity_links collection...")
    try:
        await db.create_collection("whatsapp_entity_links")
        print("✅ Collection created")
    except Exception as e:
        print(f"⚠️  Collection exists or error: {e}")
    
    # Create indexes for whatsapp_entity_links
    print("\nCreating indexes for whatsapp_entity_links...")
    
    link_indexes = [
        {"keys": [("message_id", 1)], "name": "message_id_1"},
        {"keys": [("entity_type", 1), ("entity_id", 1)], "name": "entity_lookup"},
        {"keys": [("entity_id", 1)], "name": "entity_id_1"}
    ]
    
    for index_spec in link_indexes:
        try:
            await db.whatsapp_entity_links.create_index(
                index_spec["keys"],
                name=index_spec["name"]
            )
            print(f"✅ Created index: {index_spec['name']}")
        except Exception as e:
            print(f"⚠️  Index exists or error: {index_spec['name']}")
    
    # Create refresh_tokens collection (for JWT)
    print("\nCreating refresh_tokens collection...")
    try:
        await db.create_collection("refresh_tokens")
        print("✅ Collection created")
    except Exception as e:
        print(f"⚠️  Collection exists or error: {e}")
    
    # Create indexes for refresh_tokens
    print("\nCreating indexes for refresh_tokens...")
    
    token_indexes = [
        {"keys": [("jti", 1)], "unique": True, "name": "jti_unique"},
        {"keys": [("user_id", 1), ("revoked", 1)], "name": "user_active_tokens"},
        {"keys": [("expires_at", 1)], "expireAfterSeconds": 0, "name": "token_expiry"}
    ]
    
    for index_spec in token_indexes:
        try:
            await db.refresh_tokens.create_index(
                index_spec["keys"],
                unique=index_spec.get("unique", False),
                name=index_spec["name"],
                expireAfterSeconds=index_spec.get("expireAfterSeconds")
            )
            print(f"✅ Created index: {index_spec['name']}")
        except Exception as e:
            print(f"⚠️  Index exists or error: {index_spec['name']}")
    
    print("\n✅ Database initialization complete!\n")
    print("Collections created:")
    collections = await db.list_collection_names()
    for col in collections:
        if 'whatsapp' in col or 'refresh' in col:
            print(f"  - {col}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(init_database())

"""Database Connection with Pooling"""
import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi
from pymongo.errors import ConnectionFailure

logger = logging.getLogger(__name__)

class Database:
    """MongoDB Database Connection Manager"""
    
    client: AsyncIOMotorClient = None
    
    @classmethod
    async def connect_db(cls):
        """Initialize database connection with pooling"""
        try:
            cls.client = AsyncIOMotorClient(
                os.getenv("MONGODB_URI"),
                server_api=ServerApi('1'),
                maxPoolSize=int(os.getenv("MONGODB_MAX_POOL_SIZE", 50)),
                minPoolSize=int(os.getenv("MONGODB_MIN_POOL_SIZE", 10)),
                maxIdleTimeMS=45000,
                waitQueueTimeoutMS=5000,
                connectTimeoutMS=10000,
                socketTimeoutMS=45000,
                retryWrites=True,
                w='majority',
                readPreference='primaryPreferred'
            )
            
            # Test connection
            await cls.client.admin.command('ping')
            logger.info("✓ MongoDB connection established with pooling")
            
        except ConnectionFailure as e:
            logger.error(f"✗ MongoDB connection failed: {e}")
            raise
    
    @classmethod
    async def close_db(cls):
        """Close database connection"""
        if cls.client:
            cls.client.close()
            logger.info("✓ MongoDB connection closed")
    
    @classmethod
    def get_db(cls):
        """Get database instance"""
        return cls.client[os.getenv("MONGODB_DATABASE", "madio_erp")]

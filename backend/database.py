from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None
    db = None
    
    @classmethod
    async def connect_db(cls):
        """Initialize MongoDB connection and create indexes"""
        cls.client = AsyncIOMotorClient(os.environ['MONGO_URL'])
        cls.db = cls.client[os.environ['DB_NAME']]
        
        logger.info("Creating database indexes for optimal performance...")
        
        # Users collection
        await cls.db.users.create_index([("phone", 1)], unique=True)
        await cls.db.users.create_index([("email", 1)], sparse=True)
        
        # Customers collection
        await cls.db.customers.create_index([("phone", 1)])
        await cls.db.customers.create_index([("customer_type", 1), ("lifecycle_stage", 1)])
        await cls.db.customers.create_index([("linked_divisions", 1)])
        await cls.db.customers.create_index([("full_name", 1)])
        
        # Enquiries collection
        await cls.db.enquiries.create_index([("enquiry_id", 1)], unique=True)
        await cls.db.enquiries.create_index([("division", 1), ("status", 1)])
        await cls.db.enquiries.create_index([("linked_customer_id", 1)])
        await cls.db.enquiries.create_index([("assigned_staff", 1)])
        await cls.db.enquiries.create_index([("created_at", -1)])
        
        # Quotations collection
        await cls.db.quotations.create_index([("quotation_no", 1)], unique=True)
        await cls.db.quotations.create_index([("linked_customer_id", 1)])
        await cls.db.quotations.create_index([("status", 1)])
        await cls.db.quotations.create_index([("division", 1)])
        
        # Orders collection
        await cls.db.orders.create_index([("order_no", 1)], unique=True)
        await cls.db.orders.create_index([("linked_customer_id", 1)])
        await cls.db.orders.create_index([("division", 1), ("status", 1)])
        await cls.db.orders.create_index([("order_date", -1)])
        
        # Inventory collection
        await cls.db.inventory.create_index([("item_code", 1)], unique=True)
        await cls.db.inventory.create_index([("business_area_id", 1), ("store_location", 1)])
        await cls.db.inventory.create_index([("category", 1)])
        
        # Leads collection
        await cls.db.leads.create_index([("business_area_id", 1), ("status", 1)])
        await cls.db.leads.create_index([("created_at", -1)])
        
        # Projects collection
        await cls.db.projects.create_index([("business_area_id", 1), ("status", 1)])
        await cls.db.projects.create_index([("linked_order_id", 1)])
        
        # Attendance collection
        await cls.db.attendance.create_index([("user_id", 1), ("check_in", -1)])
        
        # Tasks collection
        await cls.db.tasks.create_index([("assigned_to", 1), ("status", 1)])
        await cls.db.tasks.create_index([("project_id", 1)])
        await cls.db.tasks.create_index([("due_date", 1)])
        
        # Petty Cash collection
        await cls.db.petty_cash.create_index([("status", 1)])
        await cls.db.petty_cash.create_index([("business_area_id", 1)])
        
        # Payment Records collection
        await cls.db.payment_records.create_index([("linked_order_id", 1)])
        await cls.db.payment_records.create_index([("payment_date", -1)])
        
        # Documents collection
        await cls.db.documents.create_index([("linked_entity_type", 1), ("linked_entity_id", 1)])
        await cls.db.documents.create_index([("uploaded_by", 1)])
        
        logger.info("✅ Database indexes created successfully")
        return cls.db
    
    @classmethod
    async def close_db(cls):
        """Close database connection"""
        if cls.client:
            cls.client.close()
            logger.info("Database connection closed")

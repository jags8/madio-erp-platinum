"""Database indexes for optimal query performance"""
from motor.motor_asyncio import AsyncIOMotorDatabase
import logging

logger = logging.getLogger(__name__)

async def create_database_indexes(db: AsyncIOMotorDatabase):
    """Create all necessary database indexes"""
    try:
        # Users collection
        await db.users.create_index("phone", unique=True)
        await db.users.create_index("email")
        await db.users.create_index("created_at")
        
        # Business Areas
        await db.business_areas.create_index("name")
        await db.business_areas.create_index(["is_active", "created_at"])
        
        # Customers
        await db.customers.create_index("phone")
        await db.customers.create_index("email")
        await db.customers.create_index("gstin")
        await db.customers.create_index(["customer_type", "lifecycle_stage"])
        await db.customers.create_index(["linked_divisions", "lifecycle_stage"])
        await db.customers.create_index("created_at")
        await db.customers.create_index([
            ("full_name", "text"),
            ("company_name", "text"),
            ("email", "text")
        ])
        
        # Enquiries
        await db.enquiries.create_index("enquiry_id", unique=True)
        await db.enquiries.create_index("linked_customer_id")
        await db.enquiries.create_index(["division", "status"])
        await db.enquiries.create_index(["assigned_staff", "status"])
        await db.enquiries.create_index("follow_up_date")
        await db.enquiries.create_index("created_at")
        
        # Quotations
        await db.quotations.create_index("quotation_no", unique=True)
        await db.quotations.create_index("linked_customer_id")
        await db.quotations.create_index("linked_enquiry_id")
        await db.quotations.create_index(["division", "status"])
        await db.quotations.create_index("valid_till")
        await db.quotations.create_index("created_at")
        
        # Orders
        await db.orders.create_index("order_no", unique=True)
        await db.orders.create_index("linked_customer_id")
        await db.orders.create_index("linked_quotation_id")
        await db.orders.create_index(["division", "status"])
        await db.orders.create_index(["division", "order_date"])
        await db.orders.create_index("expected_delivery_date")
        await db.orders.create_index("order_date")
        await db.orders.create_index("balance_pending")
        
        # Inventory
        await db.inventory.create_index("item_code", unique=True)
        await db.inventory.create_index(["business_area_id", "store_location"])
        await db.inventory.create_index(["category", "quantity"])
        await db.inventory.create_index("quantity")
        await db.inventory.create_index([("item_name", "text")])
        
        # Leads
        await db.leads.create_index(["business_area_id", "status"])
        await db.leads.create_index("assigned_to")
        await db.leads.create_index("created_at")
        await db.leads.create_index("customer_phone")
        
        # Projects
        await db.projects.create_index(["business_area_id", "status"])
        await db.projects.create_index("lead_id")
        await db.projects.create_index("linked_order_id")
        await db.projects.create_index("created_at")
        
        # Payments
        await db.payments.create_index("project_id")
        await db.payments.create_index(["status", "payment_date"])
        await db.payments.create_index("payment_date")
        
        # Payment Records
        await db.payment_records.create_index("payment_id", unique=True)
        await db.payment_records.create_index("linked_order_id")
        await db.payment_records.create_index(["status", "payment_date"])
        await db.payment_records.create_index("payment_date")
        
        # Petty Cash
        await db.petty_cash.create_index(["business_area_id", "status"])
        await db.petty_cash.create_index("requested_by")
        await db.petty_cash.create_index("created_at")
        
        # Attendance
        await db.attendance.create_index(["user_id", "check_in"])
        await db.attendance.create_index("check_in")
        
        # Tasks
        await db.tasks.create_index(["assigned_to", "status"])
        await db.tasks.create_index("project_id")
        await db.tasks.create_index("due_date")
        await db.tasks.create_index("created_at")
        
        # Service Tickets
        await db.service_tickets.create_index("ticket_id", unique=True)
        await db.service_tickets.create_index("linked_customer_id")
        await db.service_tickets.create_index("linked_order_id")
        await db.service_tickets.create_index(["status", "priority"])
        await db.service_tickets.create_index("created_at")
        
        # Reviews
        await db.reviews.create_index("linked_customer_id")
        await db.reviews.create_index("linked_order_id")
        await db.reviews.create_index(["is_complaint", "resolution_status"])
        await db.reviews.create_index("created_at")
        
        # Delivery & Installation
        await db.delivery_installation.create_index("linked_order_id")
        await db.delivery_installation.create_index(["division", "completion_confirmed"])
        await db.delivery_installation.create_index("delivery_date")
        
        logger.info("✅ Database indexes created successfully")
        
    except Exception as e:
        logger.error(f"❌ Error creating indexes: {str(e)}")
        raise

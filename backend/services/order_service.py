from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

class OrderService:
    @staticmethod
    async def create_order_with_transaction(db, order_data, quotation_id, current_user):
        """
        Create order with atomic transaction across multiple collections
        Ensures data consistency for inventory, customer, and project updates
        """
        client = db.client
        
        async with await client.start_session() as session:
            try:
                async with session.start_transaction():
                    # 1. Insert order
                    order_result = await db.orders.insert_one(
                        order_data, 
                        session=session
                    )
                    order_id = str(order_result.inserted_id)
                    logger.info(f"Order {order_data['order_no']} created with ID: {order_id}")
                    
                    # 2. Deduct and unreserve inventory for each line item
                    for item in order_data['order_items']:
                        if item.get('product_code'):
                            inventory = await db.inventory.find_one(
                                {'item_code': item['product_code']},
                                session=session
                            )
                            if inventory:
                                new_qty = inventory['quantity'] - item['quantity']
                                new_reserved = inventory.get('reserved', 0) - item['quantity']
                                
                                if new_qty < 0:
                                    raise Exception(f"Insufficient inventory for {item['product_code']}")
                                
                                await db.inventory.update_one(
                                    {'_id': inventory['_id']},
                                    {
                                        '$set': {
                                            'quantity': new_qty,
                                            'reserved': max(0, new_reserved),
                                            'updated_at': datetime.now(timezone.utc)
                                        }
                                    },
                                    session=session
                                )
                                logger.info(f"Inventory updated for {item['product_code']}: {new_qty} remaining")
                    
                    # 3. Update quotation and customer if linked
                    if quotation_id:
                        quotation = await db.quotations.find_one(
                            {'_id': ObjectId(quotation_id)},
                            session=session
                        )
                        
                        if quotation:
                            # Update customer lifecycle and lifetime value
                            await db.customers.update_one(
                                {'_id': ObjectId(quotation['linked_customer_id'])},
                                {
                                    '$set': {
                                        'lifecycle_stage': 'Customer',
                                        'updated_at': datetime.now(timezone.utc)
                                    },
                                    '$inc': {'lifetime_value': order_data['net_total']}
                                },
                                session=session
                            )
                            
                            # Auto-create project from order
                            customer = await db.customers.find_one(
                                {'_id': ObjectId(quotation['linked_customer_id'])},
                                session=session
                            )
                            
                            if customer:
                                project_doc = {
                                    'business_area_id': order_data.get('business_area_id', ''),
                                    'lead_id': quotation.get('linked_enquiry_id'),
                                    'name': f"{customer['full_name']} - {order_data['division']} Project",
                                    'customer_name': customer['full_name'],
                                    'status': 'planning',
                                    'start_date': datetime.now(timezone.utc),
                                    'budget': order_data['net_total'],
                                    'actual_cost': 0,
                                    'milestones': [],
                                    'assigned_team': [],
                                    'created_at': datetime.now(timezone.utc),
                                    'updated_at': datetime.now(timezone.utc),
                                    'linked_order_id': order_id
                                }
                                project_result = await db.projects.insert_one(project_doc, session=session)
                                logger.info(f"Project created: {project_result.inserted_id}")
                    
                    logger.info(f"✅ Order {order_id} transaction completed successfully")
                    return order_id
                    
            except Exception as e:
                logger.error(f"❌ Transaction failed: {e}")
                raise Exception(f"Order creation failed: {str(e)}")

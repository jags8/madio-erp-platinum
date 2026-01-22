#!/usr/bin/env python3
"""
Seed script to create initial data for BizFlow Central CRM
"""
import asyncio
import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'backend'))

from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import bcrypt
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv(Path(__file__).parent.parent / 'backend' / '.env')

async def seed_database():
    """Create initial seed data"""
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("🌱 Starting database seeding...")
    
    # Create admin user
    pin_hash = bcrypt.hashpw('123456'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Check if admin exists
    existing_admin = await db.users.find_one({'phone': '+919876543210'})
    if not existing_admin:
        admin_user = {
            'phone': '+919876543210',
            'pin_hash': pin_hash,
            'name': 'Admin User',
            'roles': [{'role': 'admin', 'business_area_id': None}],
            'email': 'admin@bizflow.com',
            'created_at': datetime.now(timezone.utc)
        }
        await db.users.insert_one(admin_user)
        print("✅ Created admin user (Phone: +919876543210, PIN: 123456)")
    else:
        print("ℹ️  Admin user already exists")
    
    # Create business areas
    business_areas_data = [
        {
            'name': 'Furniture',
            'description': 'Premium luxury furniture for residential and commercial spaces',
            'stores': ['Mumbai Showroom', 'Delhi Showroom', 'Bangalore Showroom'],
            'created_at': datetime.now(timezone.utc),
            'is_active': True
        },
        {
            'name': 'Premium Acrylic Paints',
            'description': 'High-end acrylic paints for luxury interiors',
            'stores': ['Mumbai Warehouse', 'Delhi Warehouse'],
            'created_at': datetime.now(timezone.utc),
            'is_active': True
        },
        {
            'name': 'Doors & Windows',
            'description': 'Premium doors and windows with custom designs',
            'stores': ['Mumbai Factory', 'Delhi Factory', 'Pune Factory'],
            'created_at': datetime.now(timezone.utc),
            'is_active': True
        }
    ]
    
    existing_areas = await db.business_areas.count_documents({})
    if existing_areas == 0:
        result = await db.business_areas.insert_many(business_areas_data)
        print(f"✅ Created {len(result.inserted_ids)} business areas")
        
        # Get IDs for sample data
        furniture_area = await db.business_areas.find_one({'name': 'Furniture'})
        
        # Create sample leads
        sample_leads = [
            {
                'business_area_id': str(furniture_area['_id']),
                'customer_name': 'Rahul Sharma',
                'customer_phone': '+919876543211',
                'customer_email': 'rahul@example.com',
                'source': 'architect_referral',
                'status': 'new',
                'estimated_value': 500000,
                'notes': 'Interested in luxury sofa set',
                'created_at': datetime.now(timezone.utc),
                'updated_at': datetime.now(timezone.utc)
            },
            {
                'business_area_id': str(furniture_area['_id']),
                'customer_name': 'Priya Patel',
                'customer_phone': '+919876543212',
                'customer_email': 'priya@example.com',
                'source': 'walk_in',
                'status': 'contacted',
                'estimated_value': 750000,
                'notes': 'Looking for complete bedroom furniture',
                'created_at': datetime.now(timezone.utc),
                'updated_at': datetime.now(timezone.utc)
            }
        ]
        
        await db.leads.insert_many(sample_leads)
        print(f"✅ Created {len(sample_leads)} sample leads")
    else:
        print("ℹ️  Business areas already exist, skipping seed data")
    
    client.close()
    print("✨ Database seeding completed!")

if __name__ == '__main__':
    asyncio.run(seed_database())

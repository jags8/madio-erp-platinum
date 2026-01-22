#!/usr/bin/env python3
"""
Seed script to create role-based users for BizFlow Central CRM
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

async def seed_users():
    """Create role-based users"""
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("🔐 Creating role-based users...")
    
    # Clear existing users (optional)
    # await db.users.delete_many({})
    
    users = [
        {
            'phone': '+919876543210',
            'pin': '123456',
            'name': 'Admin User',
            'roles': [{'role': 'admin', 'business_area_id': None}],
            'email': 'admin@bizflow.com'
        },
        {
            'phone': '+919876543211',
            'pin': '123456',
            'name': 'Promoter User',
            'roles': [{'role': 'promoter', 'business_area_id': None}],
            'email': 'promoter@bizflow.com'
        },
        {
            'phone': '+919876543212',
            'pin': '123456',
            'name': 'Finance Manager',
            'roles': [{'role': 'finance', 'business_area_id': None}],
            'email': 'finance@bizflow.com'
        },
        {
            'phone': '+919876543213',
            'pin': '123456',
            'name': 'Furniture Team Lead',
            'roles': [{'role': 'team_lead', 'business_area_id': 'furniture'}],
            'email': 'furniture@bizflow.com'
        },
        {
            'phone': '+919876543214',
            'pin': '123456',
            'name': 'MAP Paints Manager',
            'roles': [{'role': 'team_lead', 'business_area_id': 'map_paints'}],
            'email': 'paints@bizflow.com'
        },
        {
            'phone': '+919876543215',
            'pin': '123456',
            'name': 'Doors & Windows Lead',
            'roles': [{'role': 'team_lead', 'business_area_id': 'doors_windows'}],
            'email': 'doors@bizflow.com'
        },
        {
            'phone': '+919876543216',
            'pin': '123456',
            'name': 'Sales Staff',
            'roles': [{'role': 'staff', 'business_area_id': None}],
            'email': 'sales@bizflow.com'
        }
    ]
    
    created_count = 0
    for user_data in users:
        # Check if user exists
        existing = await db.users.find_one({'phone': user_data['phone']})
        if existing:
            print(f"ℹ️  User {user_data['name']} already exists")
            continue
        
        # Hash PIN
        pin_hash = bcrypt.hashpw(user_data['pin'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Create user document
        user_doc = {
            'phone': user_data['phone'],
            'pin_hash': pin_hash,
            'name': user_data['name'],
            'roles': user_data['roles'],
            'email': user_data['email'],
            'created_at': datetime.now(timezone.utc)
        }
        
        await db.users.insert_one(user_doc)
        print(f"✅ Created {user_data['name']} (Phone: {user_data['phone']}, Role: {user_data['roles'][0]['role']})")
        created_count += 1
    
    client.close()
    print(f"\n✨ Created {created_count} new users!")
    print("\n📋 LOGIN CREDENTIALS:")
    print("=" * 60)
    for user_data in users:
        role = user_data['roles'][0]['role']
        print(f"{user_data['name']:25} | {user_data['phone']:15} | PIN: 123456 | Role: {role}")
    print("=" * 60)

if __name__ == '__main__':
    asyncio.run(seed_users())

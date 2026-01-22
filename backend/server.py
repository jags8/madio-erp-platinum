from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request, BackgroundTasks, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from bson import ObjectId
import httpx
import io

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

# Security
security = HTTPBearer()

app = FastAPI(title="BizFlow Central CRM")
api_router = APIRouter(prefix="/api")

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ===== Pydantic Models =====

class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    
    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError('Invalid ObjectId')
        return str(v)

class UserRole(BaseModel):
    role: str  # 'admin', 'finance', 'team_lead', 'promoter', 'staff'
    business_area_id: Optional[str] = None

class UserCreate(BaseModel):
    phone: str
    pin: str
    name: str
    roles: List[UserRole]
    email: Optional[EmailStr] = None

class UserLogin(BaseModel):
    phone: str
    pin: str

class UserResponse(BaseModel):
    id: str
    phone: str
    name: str
    roles: List[UserRole]
    email: Optional[str] = None
    created_at: datetime

class BusinessArea(BaseModel):
    id: Optional[str] = None
    name: str
    description: str
    stores: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True

class Lead(BaseModel):
    id: Optional[str] = None
    business_area_id: str
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    source: str  # 'architect_referral', 'walk_in', 'website', 'whatsapp'
    status: str  # 'new', 'contacted', 'qualified', 'proposal', 'won', 'lost'
    assigned_to: Optional[str] = None
    estimated_value: Optional[float] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Project(BaseModel):
    id: Optional[str] = None
    business_area_id: str
    lead_id: Optional[str] = None
    name: str
    customer_name: str
    status: str  # 'planning', 'in_progress', 'on_hold', 'completed', 'cancelled'
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    budget: Optional[float] = None
    actual_cost: Optional[float] = None
    milestones: List[Dict[str, Any]] = []
    assigned_team: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class InventoryItem(BaseModel):
    id: Optional[str] = None
    business_area_id: str
    store_location: str
    item_name: str
    item_code: str
    category: str
    quantity: int
    reserved: int = 0  # Reserved for quotations
    unit: str
    reorder_level: int
    unit_price: float
    supplier: Optional[str] = None
    last_restocked: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ===== Video Generation =====
class VideoGenerationRequest(BaseModel):
    prompt: str
    duration: int = 5  # seconds
    aspect_ratio: str = '16:9'  # '16:9', '9:16', '1:1'
    style: str = 'realistic'  # 'realistic', 'animated', 'artistic'

class VideoGeneration(BaseModel):
    id: Optional[str] = None
    video_id: str
    user_id: str
    prompt: str
    duration: int
    aspect_ratio: str
    style: str
    status: str = 'processing'  # 'processing', 'completed', 'failed'
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None

# ===== AI Inventory Insights =====
class InventoryInsight(BaseModel):
    item_id: str
    item_name: str
    insight_type: str  # 'slow_moving', 'overstock', 'reorder_needed', 'high_demand'
    current_quantity: int
    reserved: int
    avg_monthly_sales: float
    days_of_stock: int
    recommendation: str
    priority: str  # 'low', 'medium', 'high', 'urgent'

class Payment(BaseModel):
    id: Optional[str] = None
    project_id: Optional[str] = None
    customer_name: str
    amount: float
    payment_type: str  # 'advance', 'milestone', 'final', 'refund'
    payment_method: str  # 'cash', 'bank_transfer', 'cheque', 'upi'
    status: str  # 'pending', 'received', 'failed'
    transaction_ref: Optional[str] = None
    notes: Optional[str] = None
    payment_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PettyCash(BaseModel):
    id: Optional[str] = None
    requested_by: str
    business_area_id: str
    amount: float
    purpose: str
    category: str  # 'travel', 'supplies', 'meals', 'utilities', 'other'
    status: str  # 'pending', 'approved', 'rejected', 'disbursed'
    approved_by: Optional[str] = None
    approval_date: Optional[datetime] = None
    receipt_url: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Attendance(BaseModel):
    id: Optional[str] = None
    user_id: str
    check_in: datetime
    check_out: Optional[datetime] = None
    location_lat: float
    location_lng: float
    location_address: Optional[str] = None
    status: str  # 'present', 'half_day', 'late'
    notes: Optional[str] = None

class Task(BaseModel):
    id: Optional[str] = None
    title: str
    description: str
    priority: str  # 'low', 'medium', 'high', 'urgent'
    status: str  # 'todo', 'in_progress', 'review', 'completed'
    assigned_to: str
    assigned_by: str
    project_id: Optional[str] = None
    due_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    whatsapp_notified: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Document(BaseModel):
    id: Optional[str] = None
    name: str
    file_type: str
    file_size: int
    storage_type: str  # 'google_drive', 'sharepoint'
    storage_url: str
    uploaded_by: str
    business_area_id: Optional[str] = None
    project_id: Optional[str] = None
    tags: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DashboardStats(BaseModel):
    total_leads: int
    active_projects: int
    pending_payments: float
    low_stock_items: int
    pending_petty_cash: int
    today_attendance: int

# ===== Master CRM Customer Hub =====
class Customer(BaseModel):
    id: Optional[str] = None
    customer_type: str  # 'Individual', 'Architect', 'Builder', 'Corporate'
    full_name: str
    company_name: Optional[str] = None
    phone: str
    whatsapp: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    city: Optional[str] = None
    pincode: Optional[str] = None
    gstin: Optional[str] = None
    source: str  # 'Walk-in', 'Architect Referral', 'Website', 'WhatsApp', 'Existing'
    assigned_salesperson: Optional[str] = None
    linked_divisions: List[str] = []  # 'Furniture', 'MAP Paints', 'Doors & Windows'
    lifecycle_stage: str = 'Lead'  # 'Lead', 'Prospect', 'Customer', 'VIP', 'Inactive'
    lifetime_value: float = 0.0
    notes: Optional[str] = None
    tags: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ===== Enquiry & Lead Module =====
class Enquiry(BaseModel):
    id: Optional[str] = None
    enquiry_id: str
    linked_customer_id: str
    division: str  # 'Furniture', 'MAP Paints', 'Doors & Windows'
    product_category: Optional[str] = None
    requirement_summary: str
    budget_range_min: Optional[float] = None
    budget_range_max: Optional[float] = None
    site_visit_date: Optional[datetime] = None
    site_visit_notes: Optional[str] = None
    assigned_staff: Optional[str] = None
    enquiry_source: str
    status: str = 'New Enquiry'  # 'New Enquiry', 'Contacted', 'Site Visit Scheduled', 'Design/Estimation Ongoing', 'Quotation Shared', 'Lost'
    lost_reason: Optional[str] = None
    priority: str = 'Medium'  # 'Low', 'Medium', 'High', 'Urgent'
    follow_up_date: Optional[datetime] = None
    attachments: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ===== Quotation Module =====
class QuotationLineItem(BaseModel):
    item_no: int
    description: str
    product_code: Optional[str] = None
    quantity: float
    unit: str
    unit_price: float
    discount_percent: float = 0.0
    tax_percent: float = 0.0
    line_total: float

class Quotation(BaseModel):
    id: Optional[str] = None
    quotation_no: str
    version: int = 1
    linked_customer_id: str
    linked_enquiry_id: Optional[str] = None
    division: str
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    valid_till: datetime
    line_items: List[QuotationLineItem] = []
    subtotal: float = 0.0
    discount_amount: float = 0.0
    tax_amount: float = 0.0
    net_total: float = 0.0
    terms_conditions: Optional[str] = None
    notes: Optional[str] = None
    status: str = 'Draft'  # 'Draft', 'Sent', 'Revised', 'Approved', 'Rejected', 'Expired'
    approved_date: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    prepared_by: str
    attachments: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ===== Order Management (Division-Specific) =====
class OrderItem(BaseModel):
    item_no: int
    description: str
    product_code: Optional[str] = None
    quantity: float
    unit: str
    unit_price: float
    discount_percent: float = 0.0
    tax_percent: float = 0.0
    line_total: float
    # Division-specific fields
    material_type: Optional[str] = None
    finish: Optional[str] = None
    shade_code: Optional[str] = None
    hardware_spec: Optional[str] = None

class Order(BaseModel):
    id: Optional[str] = None
    order_no: str
    linked_customer_id: str
    linked_quotation_id: Optional[str] = None
    division: str
    order_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    order_items: List[OrderItem] = []
    subtotal: float = 0.0
    discount_amount: float = 0.0
    tax_amount: float = 0.0
    net_total: float = 0.0
    advance_paid: float = 0.0
    balance_pending: float = 0.0
    
    # Common fields
    status: str = 'Order Confirmed'
    priority: str = 'Normal'
    expected_delivery_date: Optional[datetime] = None
    actual_delivery_date: Optional[datetime] = None
    
    # Furniture-specific
    custom_dimensions: Optional[str] = None
    factory_assigned: Optional[str] = None
    design_approval_date: Optional[datetime] = None
    production_start_date: Optional[datetime] = None
    production_end_date: Optional[datetime] = None
    polishing_date: Optional[datetime] = None
    installation_date: Optional[datetime] = None
    installer_assigned: Optional[str] = None
    
    # Paints-specific
    batch_no: Optional[str] = None
    mfg_date: Optional[datetime] = None
    tinting_completed: bool = False
    ready_for_pickup: bool = False
    
    # Doors & Windows-specific
    glass_type: Optional[str] = None
    measurement_date: Optional[datetime] = None
    fabrication_start_date: Optional[datetime] = None
    fabrication_end_date: Optional[datetime] = None
    
    notes: Optional[str] = None
    attachments: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ===== Payment & Invoicing =====
class PaymentRecord(BaseModel):
    id: Optional[str] = None
    payment_id: str
    linked_order_id: str
    invoice_no: Optional[str] = None
    payment_type: str  # 'Advance', 'Milestone', 'Balance', 'Full'
    amount: float
    payment_mode: str  # 'Cash', 'Cheque', 'UPI', 'NEFT/RTGS', 'Card'
    payment_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    transaction_ref: Optional[str] = None
    receipt_url: Optional[str] = None
    notes: Optional[str] = None
    status: str = 'Received'  # 'Pending', 'Received', 'Failed', 'Refunded'
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ===== Delivery & Installation =====
class DeliveryInstallation(BaseModel):
    id: Optional[str] = None
    linked_order_id: str
    division: str
    delivery_date: Optional[datetime] = None
    installation_date: Optional[datetime] = None
    team_assigned: List[str] = []
    vehicle_no: Optional[str] = None
    site_photos: List[str] = []
    issues_logged: Optional[str] = None
    completion_confirmed: bool = False
    completion_date: Optional[datetime] = None
    customer_signature: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ===== After-Sales & Reviews =====
class Review(BaseModel):
    id: Optional[str] = None
    linked_customer_id: str
    linked_order_id: str
    rating: int  # 1-5
    feedback_text: Optional[str] = None
    is_complaint: bool = False
    complaint_category: Optional[str] = None
    resolution_status: str = 'Open'  # 'Open', 'In Progress', 'Resolved', 'Closed'
    resolved_by: Optional[str] = None
    resolved_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ServiceTicket(BaseModel):
    id: Optional[str] = None
    ticket_id: str
    linked_order_id: str
    linked_customer_id: str
    issue_type: str  # 'Defect', 'Maintenance', 'Warranty Claim', 'Complaint', 'Other'
    issue_description: str
    priority: str = 'Medium'  # 'Low', 'Medium', 'High', 'Critical'
    status: str = 'Open'  # 'Open', 'Assigned', 'In Progress', 'Resolved', 'Closed'
    assigned_technician: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    closure_date: Optional[datetime] = None
    resolution_notes: Optional[str] = None
    attachments: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ===== Helper Functions =====

def hash_pin(pin: str) -> str:
    return bcrypt.hashpw(pin.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_pin(pin: str, hashed: str) -> bool:
    return bcrypt.checkpw(pin.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(user_id: str) -> str:
    payload = {
        'user_id': user_id,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token: str) -> str:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail='Token expired')
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail='Invalid token')

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    user_id = verify_token(credentials.credentials)
    user = await db.users.find_one({'_id': ObjectId(user_id)}, {'pin_hash': 0})
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    user['id'] = str(user['_id'])
    return user

def check_role_permission(user: dict, required_roles: List[str]) -> bool:
    """Check if user has required role"""
    user_roles = [role['role'] for role in user.get('roles', [])]
    return any(role in user_roles for role in required_roles)

async def reserve_inventory(item_id: str, quantity: float) -> bool:
    """Reserve inventory for quotation"""
    item = await db.inventory.find_one({'_id': ObjectId(item_id)})
    if not item:
        return False
    
    available = item.get('quantity', 0) - item.get('reserved', 0)
    if available < quantity:
        return False
    
    await db.inventory.update_one(
        {'_id': ObjectId(item_id)},
        {'$inc': {'reserved': quantity}}
    )
    return True

async def release_inventory_reservation(item_id: str, quantity: float):
    """Release reserved inventory"""
    await db.inventory.update_one(
        {'_id': ObjectId(item_id)},
        {'$inc': {'reserved': -quantity}}
    )

async def deduct_inventory(item_id: str, quantity: float) -> bool:
    """Deduct inventory on order confirmation"""
    item = await db.inventory.find_one({'_id': ObjectId(item_id)})
    if not item:
        return False
    
    await db.inventory.update_one(
        {'_id': ObjectId(item_id)},
        {
            '$inc': {
                'quantity': -quantity,
                'reserved': -quantity
            }
        }
    )
    return True

# ===== Auth Routes =====

@api_router.post('/auth/register')
async def register(user_data: UserCreate):
    existing = await db.users.find_one({'phone': user_data.phone})
    if existing:
        raise HTTPException(status_code=400, detail='Phone number already registered')
    
    user_doc = {
        'phone': user_data.phone,
        'pin_hash': hash_pin(user_data.pin),
        'name': user_data.name,
        'roles': [r.model_dump() for r in user_data.roles],
        'email': user_data.email,
        'created_at': datetime.now(timezone.utc)
    }
    
    result = await db.users.insert_one(user_doc)
    token = create_access_token(str(result.inserted_id))
    
    return {'token': token, 'user_id': str(result.inserted_id), 'name': user_data.name}

@api_router.post('/auth/login')
async def login(credentials: UserLogin):
    user = await db.users.find_one({'phone': credentials.phone})
    if not user or not verify_pin(credentials.pin, user['pin_hash']):
        raise HTTPException(status_code=401, detail='Invalid phone or PIN')
    
    token = create_access_token(str(user['_id']))
    return {
        'token': token,
        'user_id': str(user['_id']),
        'name': user['name'],
        'roles': user['roles']
    }

@api_router.get('/auth/me')
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

# ===== Business Areas =====

@api_router.post('/business-areas')
async def create_business_area(area: BusinessArea, current_user: dict = Depends(get_current_user)):
    area_doc = area.model_dump(exclude={'id'})
    result = await db.business_areas.insert_one(area_doc)
    return {'id': str(result.inserted_id), **area_doc}

@api_router.get('/business-areas')
async def list_business_areas(current_user: dict = Depends(get_current_user)):
    areas = await db.business_areas.find({'is_active': True}).to_list(100)
    for area in areas:
        area['id'] = str(area['_id'])
        del area['_id']
    return areas

@api_router.get('/business-areas/{area_id}')
async def get_business_area(area_id: str, current_user: dict = Depends(get_current_user)):
    area = await db.business_areas.find_one({'_id': ObjectId(area_id)})
    if not area:
        raise HTTPException(status_code=404, detail='Business area not found')
    area['id'] = str(area['_id'])
    del area['_id']
    return area

# ===== Leads =====

@api_router.post('/leads')
async def create_lead(lead: Lead, current_user: dict = Depends(get_current_user)):
    lead_doc = lead.model_dump(exclude={'id'})
    result = await db.leads.insert_one(lead_doc)
    return {'id': str(result.inserted_id), **lead_doc}

@api_router.get('/leads')
async def list_leads(
    business_area_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if business_area_id:
        query['business_area_id'] = business_area_id
    if status:
        query['status'] = status
    
    leads = await db.leads.find(query).sort('created_at', -1).to_list(100)
    for lead in leads:
        lead['id'] = str(lead['_id'])
        del lead['_id']
    return leads

@api_router.patch('/leads/{lead_id}')
async def update_lead(lead_id: str, updates: dict, current_user: dict = Depends(get_current_user)):
    updates['updated_at'] = datetime.now(timezone.utc)
    result = await db.leads.update_one({'_id': ObjectId(lead_id)}, {'$set': updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail='Lead not found')
    return {'message': 'Lead updated successfully'}

# ===== Projects =====

@api_router.post('/projects')
async def create_project(project: Project, current_user: dict = Depends(get_current_user)):
    project_doc = project.model_dump(exclude={'id'})
    result = await db.projects.insert_one(project_doc)
    return {'id': str(result.inserted_id), **project_doc}

@api_router.get('/projects')
async def list_projects(
    business_area_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if business_area_id:
        query['business_area_id'] = business_area_id
    if status:
        query['status'] = status
    
    projects = await db.projects.find(query).sort('created_at', -1).to_list(100)
    for project in projects:
        project['id'] = str(project['_id'])
        del project['_id']
    return projects

@api_router.patch('/projects/{project_id}')
async def update_project(project_id: str, updates: dict, current_user: dict = Depends(get_current_user)):
    updates['updated_at'] = datetime.now(timezone.utc)
    result = await db.projects.update_one({'_id': ObjectId(project_id)}, {'$set': updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail='Project not found')
    return {'message': 'Project updated successfully'}

# ===== Inventory =====

@api_router.post('/inventory')
async def create_inventory_item(item: InventoryItem, current_user: dict = Depends(get_current_user)):
    item_doc = item.model_dump(exclude={'id'})
    result = await db.inventory.insert_one(item_doc)
    return {'id': str(result.inserted_id), **item_doc}

@api_router.get('/inventory')
async def list_inventory(
    business_area_id: Optional[str] = None,
    low_stock: bool = False,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if business_area_id:
        query['business_area_id'] = business_area_id
    if low_stock:
        query['$expr'] = {'$lte': ['$quantity', '$reorder_level']}
    
    items = await db.inventory.find(query).sort('item_name', 1).to_list(200)
    for item in items:
        item['id'] = str(item['_id'])
        del item['_id']
    return items

@api_router.patch('/inventory/{item_id}')
async def update_inventory(item_id: str, updates: dict, current_user: dict = Depends(get_current_user)):
    updates['updated_at'] = datetime.now(timezone.utc)
    result = await db.inventory.update_one({'_id': ObjectId(item_id)}, {'$set': updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail='Inventory item not found')
    return {'message': 'Inventory updated successfully'}

@api_router.get('/inventory/insights')
async def get_inventory_insights(current_user: dict = Depends(get_current_user)):
    """AI-powered inventory insights"""
    # Get all inventory items
    items = await db.inventory.find({}).to_list(500)
    insights = []
    
    for item in items:
        item_id = str(item['_id'])
        quantity = item.get('quantity', 0)
        reserved = item.get('reserved', 0)
        reorder_level = item.get('reorder_level', 0)
        available = quantity - reserved
        
        # Calculate average monthly sales (from orders)
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        sales_pipeline = [
            {'$unwind': '$order_items'},
            {'$match': {
                'order_date': {'$gte': thirty_days_ago},
                'order_items.item_code': item.get('item_code')
            }},
            {'$group': {
                '_id': None,
                'total_sold': {'$sum': '$order_items.quantity'}
            }}
        ]
        sales_result = await db.orders.aggregate(sales_pipeline).to_list(1)
        total_sold = sales_result[0]['total_sold'] if sales_result else 0
        avg_monthly_sales = total_sold
        
        # Calculate days of stock
        days_of_stock = (available / avg_monthly_sales * 30) if avg_monthly_sales > 0 else 999
        
        # Generate insights
        if days_of_stock > 90 and quantity > reorder_level * 2:
            insights.append({
                'item_id': item_id,
                'item_name': item['item_name'],
                'insight_type': 'overstock',
                'current_quantity': quantity,
                'reserved': reserved,
                'avg_monthly_sales': avg_monthly_sales,
                'days_of_stock': int(days_of_stock),
                'recommendation': f'Consider promotional pricing. Stock will last {int(days_of_stock)} days',
                'priority': 'medium'
            })
        elif days_of_stock < 30 and avg_monthly_sales > 0:
            insights.append({
                'item_id': item_id,
                'item_name': item['item_name'],
                'insight_type': 'slow_moving',
                'current_quantity': quantity,
                'reserved': reserved,
                'avg_monthly_sales': avg_monthly_sales,
                'days_of_stock': int(days_of_stock),
                'recommendation': f'Low turnover. Average sales: {avg_monthly_sales:.1f}/month',
                'priority': 'low'
            })
        
        if available <= reorder_level:
            priority = 'urgent' if available < reorder_level * 0.5 else 'high'
            insights.append({
                'item_id': item_id,
                'item_name': item['item_name'],
                'insight_type': 'reorder_needed',
                'current_quantity': quantity,
                'reserved': reserved,
                'avg_monthly_sales': avg_monthly_sales,
                'days_of_stock': int(days_of_stock),
                'recommendation': f'Reorder immediately. Only {available} units available',
                'priority': priority
            })
        
        if avg_monthly_sales > reorder_level * 1.5:
            insights.append({
                'item_id': item_id,
                'item_name': item['item_name'],
                'insight_type': 'high_demand',
                'current_quantity': quantity,
                'reserved': reserved,
                'avg_monthly_sales': avg_monthly_sales,
                'days_of_stock': int(days_of_stock),
                'recommendation': f'High demand item. Consider increasing stock levels',
                'priority': 'medium'
            })
    
    return sorted(insights, key=lambda x: {'urgent': 0, 'high': 1, 'medium': 2, 'low': 3}[x['priority']])

# ===== Finance =====

@api_router.post('/payments')
async def create_payment(payment: Payment, current_user: dict = Depends(get_current_user)):
    payment_doc = payment.model_dump(exclude={'id'})
    result = await db.payments.insert_one(payment_doc)
    return {'id': str(result.inserted_id), **payment_doc}

@api_router.get('/payments')
async def list_payments(
    status: Optional[str] = None,
    project_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if status:
        query['status'] = status
    if project_id:
        query['project_id'] = project_id
    
    payments = await db.payments.find(query).sort('payment_date', -1).to_list(100)
    for payment in payments:
        payment['id'] = str(payment['_id'])
        del payment['_id']
    return payments

# ===== Petty Cash =====

@api_router.post('/petty-cash')
async def create_petty_cash_request(request_data: PettyCash, current_user: dict = Depends(get_current_user)):
    request_data.requested_by = current_user['id']
    request_doc = request_data.model_dump(exclude={'id'})
    result = await db.petty_cash.insert_one(request_doc)
    return {'id': str(result.inserted_id), **request_doc}

@api_router.get('/petty-cash')
async def list_petty_cash(
    status: Optional[str] = None,
    business_area_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if status:
        query['status'] = status
    if business_area_id:
        query['business_area_id'] = business_area_id
    
    requests = await db.petty_cash.find(query).sort('created_at', -1).to_list(100)
    for req in requests:
        req['id'] = str(req['_id'])
        del req['_id']
    return requests

@api_router.patch('/petty-cash/{request_id}/approve')
async def approve_petty_cash(request_id: str, current_user: dict = Depends(get_current_user)):
    update = {
        'status': 'approved',
        'approved_by': current_user['id'],
        'approval_date': datetime.now(timezone.utc),
        'updated_at': datetime.now(timezone.utc)
    }
    result = await db.petty_cash.update_one({'_id': ObjectId(request_id)}, {'$set': update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail='Request not found')
    return {'message': 'Petty cash approved'}

@api_router.patch('/petty-cash/{request_id}/reject')
async def reject_petty_cash(request_id: str, notes: str, current_user: dict = Depends(get_current_user)):
    update = {
        'status': 'rejected',
        'approved_by': current_user['id'],
        'approval_date': datetime.now(timezone.utc),
        'notes': notes,
        'updated_at': datetime.now(timezone.utc)
    }
    result = await db.petty_cash.update_one({'_id': ObjectId(request_id)}, {'$set': update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail='Request not found')
    return {'message': 'Petty cash rejected'}

# ===== Attendance =====

@api_router.post('/attendance/check-in')
async def check_in(
    location_lat: float,
    location_lng: float,
    location_address: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    # Check if already checked in today
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    existing = await db.attendance.find_one({
        'user_id': current_user['id'],
        'check_in': {'$gte': today_start}
    })
    
    if existing:
        raise HTTPException(status_code=400, detail='Already checked in today')
    
    attendance_doc = {
        'user_id': current_user['id'],
        'check_in': datetime.now(timezone.utc),
        'location_lat': location_lat,
        'location_lng': location_lng,
        'location_address': location_address,
        'status': 'present'
    }
    
    result = await db.attendance.insert_one(attendance_doc)
    return {'id': str(result.inserted_id), 'message': 'Checked in successfully'}

@api_router.post('/attendance/check-out')
async def check_out(current_user: dict = Depends(get_current_user)):
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    attendance = await db.attendance.find_one({
        'user_id': current_user['id'],
        'check_in': {'$gte': today_start},
        'check_out': None
    })
    
    if not attendance:
        raise HTTPException(status_code=400, detail='No active check-in found')
    
    await db.attendance.update_one(
        {'_id': attendance['_id']},
        {'$set': {'check_out': datetime.now(timezone.utc)}}
    )
    
    return {'message': 'Checked out successfully'}

@api_router.get('/attendance')
async def list_attendance(
    user_id: Optional[str] = None,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if user_id:
        query['user_id'] = user_id
    if from_date:
        query.setdefault('check_in', {})['$gte'] = from_date
    if to_date:
        query.setdefault('check_in', {})['$lte'] = to_date
    
    records = await db.attendance.find(query).sort('check_in', -1).to_list(100)
    for record in records:
        record['id'] = str(record['_id'])
        del record['_id']
    return records

# ===== Tasks =====

@api_router.post('/tasks')
async def create_task(task: Task, current_user: dict = Depends(get_current_user)):
    task.assigned_by = current_user['id']
    task_doc = task.model_dump(exclude={'id'})
    result = await db.tasks.insert_one(task_doc)
    return {'id': str(result.inserted_id), **task_doc}

@api_router.get('/tasks')
async def list_tasks(
    assigned_to: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if assigned_to:
        query['assigned_to'] = assigned_to
    if status:
        query['status'] = status
    
    tasks = await db.tasks.find(query).sort('created_at', -1).to_list(100)
    for task in tasks:
        task['id'] = str(task['_id'])
        del task['_id']
    return tasks

@api_router.patch('/tasks/{task_id}')
async def update_task(task_id: str, updates: dict, current_user: dict = Depends(get_current_user)):
    updates['updated_at'] = datetime.now(timezone.utc)
    result = await db.tasks.update_one({'_id': ObjectId(task_id)}, {'$set': updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail='Task not found')
    return {'message': 'Task updated successfully'}

# ===== Dashboard =====

@api_router.get('/dashboard/stats')
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    total_leads = await db.leads.count_documents({})
    active_projects = await db.projects.count_documents({'status': {'$in': ['planning', 'in_progress']}})
    
    pending_payments_agg = await db.payments.aggregate([
        {'$match': {'status': 'pending'}},
        {'$group': {'_id': None, 'total': {'$sum': '$amount'}}}
    ]).to_list(1)
    pending_payments = pending_payments_agg[0]['total'] if pending_payments_agg else 0
    
    low_stock_items = await db.inventory.count_documents({'$expr': {'$lte': ['$quantity', '$reorder_level']}})
    pending_petty_cash = await db.petty_cash.count_documents({'status': 'pending'})
    
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_attendance = await db.attendance.count_documents({'check_in': {'$gte': today_start}})
    
    return DashboardStats(
        total_leads=total_leads,
        active_projects=active_projects,
        pending_payments=pending_payments,
        low_stock_items=low_stock_items,
        pending_petty_cash=pending_petty_cash,
        today_attendance=today_attendance
    )

@api_router.get('/dashboard/recent-activities')
async def get_recent_activities(current_user: dict = Depends(get_current_user)):
    # Get recent leads
    recent_leads = await db.leads.find({}).sort('created_at', -1).limit(5).to_list(5)
    for lead in recent_leads:
        lead['id'] = str(lead['_id'])
        del lead['_id']
        lead['type'] = 'lead'
    
    # Get recent projects
    recent_projects = await db.projects.find({}).sort('created_at', -1).limit(5).to_list(5)
    for project in recent_projects:
        project['id'] = str(project['_id'])
        del project['_id']
        project['type'] = 'project'
    
    return {'leads': recent_leads, 'projects': recent_projects}

# ===== Master CRM Customer Hub =====

@api_router.post('/customers')
async def create_customer(customer: Customer, current_user: dict = Depends(get_current_user)):
    customer_doc = customer.model_dump(exclude={'id'})
    result = await db.customers.insert_one(customer_doc)
    return {'id': str(result.inserted_id), **customer_doc}

@api_router.get('/customers')
async def list_customers(
    customer_type: Optional[str] = None,
    lifecycle_stage: Optional[str] = None,
    division: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if customer_type:
        query['customer_type'] = customer_type
    if lifecycle_stage:
        query['lifecycle_stage'] = lifecycle_stage
    if division:
        query['linked_divisions'] = division
    if search:
        query['$or'] = [
            {'full_name': {'$regex': search, '$options': 'i'}},
            {'phone': {'$regex': search, '$options': 'i'}},
            {'email': {'$regex': search, '$options': 'i'}}
        ]
    
    customers = await db.customers.find(query).sort('created_at', -1).to_list(200)
    for customer in customers:
        customer['id'] = str(customer['_id'])
        del customer['_id']
    return customers

@api_router.get('/customers/{customer_id}')
async def get_customer(customer_id: str, current_user: dict = Depends(get_current_user)):
    customer = await db.customers.find_one({'_id': ObjectId(customer_id)})
    if not customer:
        raise HTTPException(status_code=404, detail='Customer not found')
    customer['id'] = str(customer['_id'])
    del customer['_id']
    return customer

@api_router.patch('/customers/{customer_id}')
async def update_customer(customer_id: str, updates: dict, current_user: dict = Depends(get_current_user)):
    updates['updated_at'] = datetime.now(timezone.utc)
    result = await db.customers.update_one({'_id': ObjectId(customer_id)}, {'$set': updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail='Customer not found')
    return {'message': 'Customer updated successfully'}

# ===== Enquiry & Lead Module =====

@api_router.post('/enquiries')
async def create_enquiry(enquiry: Enquiry, current_user: dict = Depends(get_current_user)):
    # Generate enquiry ID
    count = await db.enquiries.count_documents({})
    enquiry.enquiry_id = f'ENQ-{datetime.now().strftime("%Y%m")}-{count + 1:04d}'
    
    enquiry_doc = enquiry.model_dump(exclude={'id'})
    result = await db.enquiries.insert_one(enquiry_doc)
    return {'id': str(result.inserted_id), **enquiry_doc}

@api_router.get('/enquiries')
async def list_enquiries(
    division: Optional[str] = None,
    status: Optional[str] = None,
    assigned_staff: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if division:
        query['division'] = division
    if status:
        query['status'] = status
    if assigned_staff:
        query['assigned_staff'] = assigned_staff
    
    enquiries = await db.enquiries.find(query).sort('created_at', -1).to_list(200)
    for enq in enquiries:
        enq['id'] = str(enq['_id'])
        del enq['_id']
    return enquiries

@api_router.get('/enquiries/kanban')
async def get_enquiries_kanban(
    division: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if division:
        query['division'] = division
    
    enquiries = await db.enquiries.find(query).to_list(200)
    
    # Group by status for Kanban
    kanban = {
        'New Enquiry': [],
        'Contacted': [],
        'Site Visit Scheduled': [],
        'Design/Estimation Ongoing': [],
        'Quotation Shared': [],
        'Lost': []
    }
    
    for enq in enquiries:
        enq['id'] = str(enq['_id'])
        del enq['_id']
        if enq['status'] in kanban:
            kanban[enq['status']].append(enq)
    
    return kanban

@api_router.patch('/enquiries/{enquiry_id}')
async def update_enquiry(enquiry_id: str, updates: dict, current_user: dict = Depends(get_current_user)):
    updates['updated_at'] = datetime.now(timezone.utc)
    result = await db.enquiries.update_one({'_id': ObjectId(enquiry_id)}, {'$set': updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail='Enquiry not found')
    return {'message': 'Enquiry updated successfully'}

# ===== Quotation Module =====

@api_router.post('/quotations')
async def create_quotation(quotation: Quotation, current_user: dict = Depends(get_current_user)):
    # Generate quotation number
    count = await db.quotations.count_documents({})
    quotation.quotation_no = f'QT-{datetime.now().strftime("%Y%m")}-{count + 1:04d}'
    quotation.prepared_by = current_user['id']
    
    # Calculate totals
    quotation.subtotal = sum(item.line_total for item in quotation.line_items)
    quotation.net_total = quotation.subtotal - quotation.discount_amount + quotation.tax_amount
    
    # Auto-reserve inventory for line items
    reservations = []
    for item in quotation.line_items:
        if item.product_code:
            inventory_item = await db.inventory.find_one({'item_code': item.product_code})
            if inventory_item:
                reserved = await reserve_inventory(str(inventory_item['_id']), item.quantity)
                if reserved:
                    reservations.append({
                        'item_id': str(inventory_item['_id']),
                        'quantity': item.quantity
                    })
    
    quotation_doc = quotation.model_dump(exclude={'id'})
    quotation_doc['inventory_reservations'] = reservations
    result = await db.quotations.insert_one(quotation_doc)
    
    return {'id': str(result.inserted_id), **quotation_doc}

@api_router.get('/quotations')
async def list_quotations(
    customer_id: Optional[str] = None,
    division: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if customer_id:
        query['linked_customer_id'] = customer_id
    if division:
        query['division'] = division
    if status:
        query['status'] = status
    
    quotations = await db.quotations.find(query).sort('created_at', -1).to_list(200)
    for quot in quotations:
        quot['id'] = str(quot['_id'])
        del quot['_id']
    return quotations

@api_router.patch('/quotations/{quotation_id}')
async def update_quotation(quotation_id: str, updates: dict, current_user: dict = Depends(get_current_user)):
    # Check if status is changing to 'Lost' or 'Rejected' - release reservations
    if updates.get('status') in ['Lost', 'Rejected', 'Expired']:
        quotation = await db.quotations.find_one({'_id': ObjectId(quotation_id)})
        if quotation and quotation.get('inventory_reservations'):
            for reservation in quotation['inventory_reservations']:
                await release_inventory_reservation(reservation['item_id'], reservation['quantity'])
    
    updates['updated_at'] = datetime.now(timezone.utc)
    result = await db.quotations.update_one({'_id': ObjectId(quotation_id)}, {'$set': updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail='Quotation not found')
    return {'message': 'Quotation updated successfully'}

@api_router.post('/quotations/{quotation_id}/approve')
async def approve_quotation(quotation_id: str, current_user: dict = Depends(get_current_user)):
    update = {
        'status': 'Approved',
        'approved_date': datetime.now(timezone.utc),
        'updated_at': datetime.now(timezone.utc)
    }
    result = await db.quotations.update_one({'_id': ObjectId(quotation_id)}, {'$set': update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail='Quotation not found')
    
    # Update linked enquiry to 'Converted'
    quotation = await db.quotations.find_one({'_id': ObjectId(quotation_id)})
    if quotation and quotation.get('linked_enquiry_id'):
        await db.enquiries.update_one(
            {'_id': ObjectId(quotation['linked_enquiry_id'])},
            {'$set': {'status': 'Converted', 'updated_at': datetime.now(timezone.utc)}}
        )
    
    return {'message': 'Quotation approved successfully'}

# ===== Order Management =====

@api_router.post('/orders')
async def create_order(order: Order, current_user: dict = Depends(get_current_user)):
    # Generate order number
    count = await db.orders.count_documents({})
    order.order_no = f'ORD-{datetime.now().strftime("%Y%m")}-{count + 1:04d}'
    
    # Calculate totals
    order.subtotal = sum(item.line_total for item in order.order_items)
    order.net_total = order.subtotal - order.discount_amount + order.tax_amount
    order.balance_pending = order.net_total - order.advance_paid
    
    # Auto-deduct inventory for order items
    for item in order.order_items:
        if item.product_code:
            inventory_item = await db.inventory.find_one({'item_code': item.product_code})
            if inventory_item:
                await deduct_inventory(str(inventory_item['_id']), item.quantity)
    
    order_doc = order.model_dump(exclude={'id'})
    result = await db.orders.insert_one(order_doc)
    
    # If order has linked quotation, mark customer as converted and create project
    if order.linked_quotation_id:
        quotation = await db.quotations.find_one({'_id': ObjectId(order.linked_quotation_id)})
        if quotation:
            # Update customer lifecycle
            await db.customers.update_one(
                {'_id': ObjectId(quotation['linked_customer_id'])},
                {'$set': {'lifecycle_stage': 'Customer', 'updated_at': datetime.now(timezone.utc)}}
            )
            
            # Auto-create project from order
            customer = await db.customers.find_one({'_id': ObjectId(quotation['linked_customer_id'])})
            if customer:
                project_doc = {
                    'business_area_id': order.business_area_id,
                    'lead_id': quotation.get('linked_enquiry_id'),
                    'name': f"{customer['full_name']} - {order.division} Project",
                    'customer_name': customer['full_name'],
                    'status': 'planning',
                    'start_date': datetime.now(timezone.utc),
                    'budget': order.net_total,
                    'actual_cost': 0,
                    'milestones': [],
                    'assigned_team': [],
                    'created_at': datetime.now(timezone.utc),
                    'updated_at': datetime.now(timezone.utc),
                    'linked_order_id': str(result.inserted_id)
                }
                await db.projects.insert_one(project_doc)
    
    return {'id': str(result.inserted_id), **order_doc}

@api_router.get('/orders')
async def list_orders(
    customer_id: Optional[str] = None,
    division: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if customer_id:
        query['linked_customer_id'] = customer_id
    if division:
        query['division'] = division
    if status:
        query['status'] = status
    
    orders = await db.orders.find(query).sort('order_date', -1).to_list(200)
    for order in orders:
        order['id'] = str(order['_id'])
        del order['_id']
    return orders

@api_router.get('/orders/{order_id}')
async def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({'_id': ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail='Order not found')
    order['id'] = str(order['_id'])
    del order['_id']
    return order

@api_router.patch('/orders/{order_id}')
async def update_order(order_id: str, updates: dict, current_user: dict = Depends(get_current_user)):
    updates['updated_at'] = datetime.now(timezone.utc)
    result = await db.orders.update_one({'_id': ObjectId(order_id)}, {'$set': updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail='Order not found')
    return {'message': 'Order updated successfully'}

# ===== Payment Records =====

@api_router.post('/payment-records')
async def create_payment_record(payment: PaymentRecord, current_user: dict = Depends(get_current_user)):
    # Generate payment ID
    count = await db.payment_records.count_documents({})
    payment.payment_id = f'PAY-{datetime.now().strftime("%Y%m")}-{count + 1:04d}'
    payment.created_by = current_user['id']
    
    payment_doc = payment.model_dump(exclude={'id'})
    result = await db.payment_records.insert_one(payment_doc)
    
    # Update order balance
    order = await db.orders.find_one({'_id': ObjectId(payment.linked_order_id)})
    if order:
        new_balance = order.get('balance_pending', 0) - payment.amount
        await db.orders.update_one(
            {'_id': ObjectId(payment.linked_order_id)},
            {'$set': {'balance_pending': new_balance}}
        )
    
    return {'id': str(result.inserted_id), **payment_doc}

@api_router.get('/payment-records')
async def list_payment_records(
    order_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if order_id:
        query['linked_order_id'] = order_id
    if status:
        query['status'] = status
    
    payments = await db.payment_records.find(query).sort('payment_date', -1).to_list(200)
    for payment in payments:
        payment['id'] = str(payment['_id'])
        del payment['_id']
    return payments

# ===== Delivery & Installation =====

@api_router.post('/delivery-installation')
async def create_delivery(delivery: DeliveryInstallation, current_user: dict = Depends(get_current_user)):
    delivery_doc = delivery.model_dump(exclude={'id'})
    result = await db.delivery_installation.insert_one(delivery_doc)
    return {'id': str(result.inserted_id), **delivery_doc}

@api_router.get('/delivery-installation')
async def list_deliveries(
    order_id: Optional[str] = None,
    division: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if order_id:
        query['linked_order_id'] = order_id
    if division:
        query['division'] = division
    
    deliveries = await db.delivery_installation.find(query).sort('created_at', -1).to_list(200)
    for delivery in deliveries:
        delivery['id'] = str(delivery['_id'])
        del delivery['_id']
    return deliveries

@api_router.patch('/delivery-installation/{delivery_id}')
async def update_delivery(delivery_id: str, updates: dict, current_user: dict = Depends(get_current_user)):
    updates['updated_at'] = datetime.now(timezone.utc)
    result = await db.delivery_installation.update_one({'_id': ObjectId(delivery_id)}, {'$set': updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail='Delivery record not found')
    return {'message': 'Delivery updated successfully'}

# ===== Reviews & Service Tickets =====

@api_router.post('/reviews')
async def create_review(review: Review, current_user: dict = Depends(get_current_user)):
    review_doc = review.model_dump(exclude={'id'})
    result = await db.reviews.insert_one(review_doc)
    return {'id': str(result.inserted_id), **review_doc}

@api_router.get('/reviews')
async def list_reviews(
    customer_id: Optional[str] = None,
    order_id: Optional[str] = None,
    is_complaint: Optional[bool] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if customer_id:
        query['linked_customer_id'] = customer_id
    if order_id:
        query['linked_order_id'] = order_id
    if is_complaint is not None:
        query['is_complaint'] = is_complaint
    
    reviews = await db.reviews.find(query).sort('created_at', -1).to_list(200)
    for review in reviews:
        review['id'] = str(review['_id'])
        del review['_id']
    return reviews

@api_router.post('/service-tickets')
async def create_service_ticket(ticket: ServiceTicket, current_user: dict = Depends(get_current_user)):
    # Generate ticket ID
    count = await db.service_tickets.count_documents({})
    ticket.ticket_id = f'TKT-{datetime.now().strftime("%Y%m")}-{count + 1:04d}'
    
    ticket_doc = ticket.model_dump(exclude={'id'})
    result = await db.service_tickets.insert_one(ticket_doc)
    return {'id': str(result.inserted_id), **ticket_doc}

@api_router.get('/service-tickets')
async def list_service_tickets(
    customer_id: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if customer_id:
        query['linked_customer_id'] = customer_id
    if status:
        query['status'] = status
    if priority:
        query['priority'] = priority
    
    tickets = await db.service_tickets.find(query).sort('created_at', -1).to_list(200)
    for ticket in tickets:
        ticket['id'] = str(ticket['_id'])
        del ticket['_id']
    return tickets

@api_router.patch('/service-tickets/{ticket_id}')
async def update_service_ticket(ticket_id: str, updates: dict, current_user: dict = Depends(get_current_user)):
    updates['updated_at'] = datetime.now(timezone.utc)
    result = await db.service_tickets.update_one({'_id': ObjectId(ticket_id)}, {'$set': updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail='Service ticket not found')
    return {'message': 'Service ticket updated successfully'}

# ===== Executive Dashboards =====

@api_router.get('/dashboard/executive')
async def get_executive_dashboard(current_user: dict = Depends(get_current_user)):
    # Sales KPIs
    total_customers = await db.customers.count_documents({})
    total_enquiries = await db.enquiries.count_documents({})
    enquiries_converted = await db.enquiries.count_documents({'status': 'Quotation Shared'})
    conversion_rate = (enquiries_converted / total_enquiries * 100) if total_enquiries > 0 else 0
    
    # Orders & Revenue
    orders_pipeline = [
        {'$group': {
            '_id': None,
            'total_orders': {'$sum': 1},
            'total_revenue': {'$sum': '$net_total'},
            'avg_order_value': {'$avg': '$net_total'}
        }}
    ]
    orders_stats = await db.orders.aggregate(orders_pipeline).to_list(1)
    orders_data = orders_stats[0] if orders_stats else {'total_orders': 0, 'total_revenue': 0, 'avg_order_value': 0}
    
    # Payments
    pending_amount_pipeline = [
        {'$group': {'_id': None, 'total_pending': {'$sum': '$balance_pending'}}}
    ]
    pending_stats = await db.orders.aggregate(pending_amount_pipeline).to_list(1)
    total_pending = pending_stats[0]['total_pending'] if pending_stats else 0
    
    # Deliveries
    pending_deliveries = await db.delivery_installation.count_documents({'completion_confirmed': False})
    
    # Reviews & Complaints
    total_reviews = await db.reviews.count_documents({})
    avg_rating_pipeline = [
        {'$group': {'_id': None, 'avg_rating': {'$avg': '$rating'}}}
    ]
    rating_stats = await db.reviews.aggregate(avg_rating_pipeline).to_list(1)
    avg_rating = rating_stats[0]['avg_rating'] if rating_stats else 0
    
    open_complaints = await db.reviews.count_documents({'is_complaint': True, 'resolution_status': {'$ne': 'Closed'}})
    open_tickets = await db.service_tickets.count_documents({'status': {'$ne': 'Closed'}})
    
    # Division-wise breakdown
    division_pipeline = [
        {'$group': {
            '_id': '$division',
            'total_orders': {'$sum': 1},
            'total_revenue': {'$sum': '$net_total'}
        }}
    ]
    division_stats = await db.orders.aggregate(division_pipeline).to_list(10)
    
    return {
        'sales': {
            'total_customers': total_customers,
            'total_enquiries': total_enquiries,
            'conversion_rate': round(conversion_rate, 2),
            'total_orders': orders_data['total_orders'],
            'total_revenue': orders_data['total_revenue'],
            'avg_order_value': orders_data['avg_order_value']
        },
        'finance': {
            'total_pending_amount': total_pending,
            'total_collected': orders_data['total_revenue'] - total_pending
        },
        'operations': {
            'pending_deliveries': pending_deliveries
        },
        'customer_experience': {
            'total_reviews': total_reviews,
            'avg_rating': round(avg_rating, 2),
            'open_complaints': open_complaints,
            'open_tickets': open_tickets
        },
        'divisions': division_stats
    }

# Health check
@api_router.get('/')
async def root():
    return {'message': 'BizFlow Central CRM API', 'status': 'operational'}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=['*'],
    allow_headers=['*'],
)

@app.on_event('shutdown')
async def shutdown_db_client():
    client.close()

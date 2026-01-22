# BizFlow Central CRM

A comprehensive CRM application for organizations with multiple business areas, built for the premium/luxury architect referral segment.

## 🚀 Features Implemented

### ✅ Core Functionality
- **Phone Number + PIN Authentication** - Secure login system with hashed PINs
- **Multi-Business Area Management** - Manage Furniture, Premium Acrylic Paints, Doors & Windows (expandable)
- **Role-Based Access Control** - Admin, Finance, Team Lead, Promoter, Staff roles
- **Leads Management** - Track customer leads with status, source, and estimated value
- **Dashboard** - Real-time stats with Bento grid layout
- **Attendance System** - GPS-based check-in/check-out with location tracking
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile

### 🎨 Design
- **Professional/Corporate Aesthetic** - Tailored for luxury segment
- **Playfair Display** serif font for headings
- **Manrope** sans-serif for body text
- **Deep Emerald** primary color (#2B5F4C)
- **Muted Gold** accent color (#B8860B)
- **Bone/Cream** background with subtle noise texture
- **Sharp architectural edges** (2px border radius)
- **Glassmorphism effects** for overlays
- **Smooth hover animations** and transitions

### 📋 Modules (Implemented)
1. **Business Areas** - Create and manage business divisions with stores
2. **Leads** - Customer lead tracking and management
3. **Dashboard** - Overview with KPIs and recent activities
4. **Attendance** - GPS-based time tracking
5. **Projects** - (Ready for implementation)
6. **Inventory** - (Ready for implementation)
7. **Finance** - (Ready for implementation)
8. **Petty Cash** - (Ready for implementation)
9. **Tasks** - (Ready for implementation)

### 🔌 Integration Readiness
- **WhatsApp Business API** - Integration playbook received for expense handling, customer responses, and task notifications
- **Google Drive/Sheets** - OAuth integration playbook ready
- **SharePoint** - Microsoft Graph API integration playbook ready

## 🔐 Login Credentials

**Test Account:**
- Phone: `+919876543210`
- PIN: `123456`
- Role: Admin

## 📊 Sample Data

The application comes pre-seeded with:
- 1 Admin user
- 3 Business areas (Furniture, Premium Acrylic Paints, Doors & Windows)
- 2 Sample leads

## 🛠️ Technical Stack

### Backend
- **FastAPI** - Modern Python web framework
- **MongoDB** - NoSQL database with Motor async driver
- **JWT** - Token-based authentication
- **bcrypt** - PIN hashing
- **Python 3.11**

### Frontend
- **React 19** - Latest React with hooks
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Accessible component library
- **Lucide React** - Beautiful icons
- **Axios** - HTTP client
- **React Router DOM** - Client-side routing
- **Sonner** - Toast notifications

## 📁 Project Structure

```
/app/
├── backend/
│   ├── server.py          # Main FastAPI application with all routes
│   ├── .env               # Environment variables
│   └── requirements.txt   # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.js         # Main React component with routing
│   │   ├── pages/         # Page components
│   │   │   ├── LoginPage.js
│   │   │   ├── DashboardPage.js
│   │   │   ├── BusinessAreasPage.js
│   │   │   ├── LeadsPage.js
│   │   │   ├── AttendancePage.js
│   │   │   └── ... (other pages)
│   │   └── components/    # Reusable components
│   │       ├── Layout.js
│   │       └── ui/        # shadcn components
│   ├── tailwind.config.js
│   └── package.json
└── scripts/
    └── seed_data.py       # Database seeding script
```

## 🚀 Getting Started

The application is already running and accessible at:
- **Frontend:** https://bizflow-central-8.preview.emergentagent.com
- **Backend API:** https://bizflow-central-8.preview.emergentagent.com/api

### Local Development

Backend:
```bash
cd /app/backend
pip install -r requirements.txt
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

Frontend:
```bash
cd /app/frontend
yarn install
yarn start
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with phone & PIN
- `GET /api/auth/me` - Get current user

### Business Areas
- `GET /api/business-areas` - List all areas
- `POST /api/business-areas` - Create new area
- `GET /api/business-areas/{id}` - Get specific area

### Leads
- `GET /api/leads` - List leads (with filters)
- `POST /api/leads` - Create new lead
- `PATCH /api/leads/{id}` - Update lead

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `PATCH /api/projects/{id}` - Update project

### Inventory
- `GET /api/inventory` - List items
- `POST /api/inventory` - Add item
- `PATCH /api/inventory/{id}` - Update item

### Finance
- `GET /api/payments` - List payments
- `POST /api/payments` - Record payment

### Petty Cash
- `GET /api/petty-cash` - List requests
- `POST /api/petty-cash` - Create request
- `PATCH /api/petty-cash/{id}/approve` - Approve
- `PATCH /api/petty-cash/{id}/reject` - Reject

### Attendance
- `POST /api/attendance/check-in` - Check in with GPS
- `POST /api/attendance/check-out` - Check out
- `GET /api/attendance` - List attendance records

### Tasks
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task
- `PATCH /api/tasks/{id}` - Update task

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/recent-activities` - Recent leads & projects

## 🔄 Next Steps

### Phase 1: Core Enhancement
1. **Complete Project Management**
   - Milestone tracking
   - Team assignments
   - Timeline visualization
   
2. **Inventory Management**
   - Stock levels and alerts
   - Reorder management
   - Multi-location tracking

3. **Finance Module**
   - Payment tracking
   - Invoice generation
   - Financial reports

4. **Petty Cash Workflow**
   - Request/approval flow
   - Receipt uploads
   - Expense categories

5. **Task Management**
   - Assignment and tracking
   - Priority levels
   - Due date management

### Phase 2: Integrations
1. **WhatsApp Business API**
   - Expense submission via WhatsApp
   - Automated customer responses
   - Task notifications
   
2. **Google Drive/Sheets**
   - Document storage
   - Data export/import
   - Collaborative editing

3. **SharePoint Integration**
   - Enterprise document management
   - Version control
   - Team collaboration

### Phase 3: Advanced Features
1. **Reporting & Analytics**
   - Custom reports
   - Charts and visualizations
   - Export capabilities

2. **Mobile App**
   - React Native version
   - Offline support
   - Push notifications

3. **AI Features**
   - Lead scoring
   - Sales forecasting
   - Automated task suggestions

## 🎯 Business Areas Supported

1. **Furniture** - Premium luxury furniture
2. **Premium Acrylic Paints** - High-end paints
3. **Doors & Windows** - Custom designs
4. **Expandable** - Easily add new areas

## 💡 Key Features

- **License-Free**: Self-hosted solution
- **No Monthly Costs**: One-time deployment
- **Scalable**: Add stores and areas as needed
- **Secure**: JWT authentication with PIN hashing
- **Real-time**: Live updates and notifications
- **Mobile-First**: Responsive design for all devices

## 🐛 Known Limitations

- WhatsApp integration requires API credentials (not yet configured)
- Google Drive/Sheets requires OAuth setup
- SharePoint requires Microsoft credentials
- Some modules are placeholder interfaces (marked as "Coming soon")

## 📞 Support

For issues or questions, please contact your development team or refer to the integration playbooks for external service setup.

---

**Built with ❤️ for premium luxury business management**

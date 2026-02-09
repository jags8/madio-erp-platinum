# Emergent AI Development Prompt - Madio ERP Platinum

## 🎯 PROJECT OVERVIEW
Build a production-ready ERP system for Madio (furniture, doors & windows, premium paints business) with Finance, Project Management, and WhatsApp-style internal communication.

**Repository:** https://github.com/jags8/madio-erp-platinum  
**Branch:** feature/production-enhancements  
**Tech Stack:** React + FastAPI + MongoDB + Redis + SharePoint

---

## 📋 CORE REQUIREMENTS

### 1. FINANCE MODULE
**Required Features:**
- Petty cash management with multi-level approval workflow
- Expense tracking by project/department/category
- Budget vs actual reporting with variance analysis
- Invoice generation and tracking
- Payment reminders and collection tracking
- GST calculations (Indian tax system)
- Financial dashboards with charts (revenue, expenses, profit)
- Export to Excel/PDF for accounting

**Database Collections:**
- `petty_cash_requests` - approval workflow, attachments, history
- `expenses` - categorized spending records
- `invoices` - customer billing
- `budgets` - department/project budgets
- `payments` - payment tracking

### 2. PROJECT MANAGEMENT
**Required Features:**
- Project creation with client, timeline, budget
- Task assignment with priorities and deadlines
- Milestone tracking with deliverables
- Team collaboration with comments/notes
- Document repository per project
- Project status dashboard (on-time, delayed, completed)
- Resource allocation view
- Project profitability analysis
- Gantt chart timeline view

**Database Collections:**
- `projects` - master records
- `tasks` - work items with assignments
- `milestones` - key deliverables
- `project_documents` - file metadata (actual files in SharePoint)
- `time_logs` - team member time tracking

### 3. WHATSAPP-STYLE CHAT
**Required Features:**
- Real-time messaging (text, emojis)
- File sharing (images, videos, documents, PDFs)
- Automatic SharePoint upload for all media
- Conversation rooms (project-based, department-based, general)
- Unread message indicators
- Message search and filtering
- @mentions for team members
- Mobile-responsive design
- Works on desktop and mobile browsers
- File preview before sending
- Download files from chat history

**Technical Implementation:**
- Two-panel layout: Room list (left) + Chat area (right)
- WhatsApp green theme (#00A884)
- Message bubbles with timestamps
- File upload via drag-drop or click
- Auto-upload to SharePoint with folder structure:
  - `/Madio ERP/Chat Media/{room_name}/{YYYY-MM}/{filename}`
- Store SharePoint URL in message metadata
- Real-time updates using polling (every 3 seconds)

**Database Collections:**
- `chat_rooms` - room metadata, participants
- `chat_messages` - message history with file URLs
- `chat_participants` - user-room relationships

### 4. USER MANAGEMENT
**Required Features:**
- Role-based access control (Admin, Manager, Staff, Accountant)
- Employee profiles with photo, contact, department
- Login/logout with JWT authentication
- Password reset functionality
- User activity logs
- Permission management per module

---

## 🏗️ ARCHITECTURE REQUIREMENTS

### Backend (FastAPI)
```
backend/
├── routes/
│   ├── auth_routes.py         # Login, logout, JWT
│   ├── finance_routes.py      # Petty cash, expenses, invoices
│   ├── project_routes.py      # Projects, tasks, milestones
│   ├── chat_routes.py         # Internal chat, file upload
│   └── user_routes.py         # User management
├── services/
│   ├── sharepoint_service.py  # File upload to SharePoint
│   ├── notification_service.py # Email/alerts
│   └── report_service.py      # Excel/PDF generation
├── models/
│   └── schemas.py             # Pydantic models
├── database/
│   └── connection.py          # MongoDB with pooling
├── middleware/
│   ├── auth_middleware.py     # JWT verification
│   └── rate_limiter.py        # API throttling
└── config/
    └── settings.py            # Environment config
```

### Frontend (React)
```
frontend/src/
├── components/
│   ├── Finance/
│   │   ├── PettyCashForm.jsx
│   │   ├── ExpenseTracker.jsx
│   │   └── FinanceDashboard.jsx
│   ├── Projects/
│   │   ├── ProjectList.jsx
│   │   ├── ProjectDetails.jsx
│   │   ├── TaskBoard.jsx
│   │   └── GanttChart.jsx
│   ├── Chat/
│   │   ├── ChatRooms.jsx
│   │   ├── ChatWindow.jsx
│   │   └── FileUpload.jsx
│   └── Common/
│       ├── Navbar.jsx
│       ├── Sidebar.jsx
│       └── Dashboard.jsx
├── contexts/
│   └── AuthContext.jsx
├── hooks/
│   └── useAuth.js
└── utils/
    ├── api.js                 # Axios config
    └── helpers.js
```

### Database Schema (MongoDB)
**Key Collections with Indexes:**
- `users` - email_unique, role_index
- `projects` - status_index, client_index, created_date
- `tasks` - project_id, assignee_id, status, due_date
- `petty_cash_requests` - status_index, requester_id, date
- `chat_messages` - room_id + created_at (compound), sender_id
- `chat_rooms` - participants array index

---

## 🔧 IMPLEMENTATION PRIORITIES

### Phase 1: Foundation (COMPLETE FIRST)
1. Database setup with all collections and indexes
2. JWT authentication with refresh tokens
3. User management (CRUD + roles)
4. Basic dashboard layout with navigation

### Phase 2: Core Modules (COMPLETE SECOND)
5. Finance module - Petty cash workflow
6. Project management - Projects and tasks
7. SharePoint integration service
8. File upload/download functionality

### Phase 3: Communication (COMPLETE THIRD)
9. Chat rooms creation and management
10. Real-time messaging with file sharing
11. SharePoint auto-upload from chat
12. Mobile-responsive chat UI

### Phase 4: Polish (COMPLETE LAST)
13. Reports and exports (Excel/PDF)
14. Dashboard charts and analytics
15. Notifications and alerts
16. Performance optimization

---

## 🎨 UI/UX REQUIREMENTS

### Design System
- **Primary Color:** #00A884 (WhatsApp green)
- **Secondary Color:** #1976d2 (Blue for professional sections)
- **Framework:** Material-UI (MUI) v5
- **Icons:** Material Icons
- **Charts:** Recharts or Chart.js
- **Layout:** Responsive grid system

### Key Screens
1. **Dashboard** - Cards showing: Total projects, Pending petty cash, Active tasks, Unread messages
2. **Finance Page** - Tabs: Petty Cash, Expenses, Invoices, Reports
3. **Projects Page** - List view with filters, cards showing progress
4. **Chat Page** - WhatsApp-style two-panel layout
5. **Reports Page** - Filter options, preview, export buttons

---

## 🔐 SECURITY REQUIREMENTS

1. **Authentication:** JWT with 30-min access token, 7-day refresh token
2. **Authorization:** Role-based permissions per route
3. **Rate Limiting:** 100 requests/minute per user
4. **Data Validation:** Pydantic models on backend, Yup on frontend
5. **File Upload:** Max 100MB, validate file types
6. **CORS:** Restrict to production domains only
7. **Environment Variables:** Never commit secrets

---

## 📱 MOBILE RESPONSIVENESS

- Chat must work perfectly on mobile browsers
- Upload photos directly from mobile camera
- Touch-friendly UI elements (48px minimum)
- Responsive tables (horizontal scroll on mobile)
- Bottom navigation on mobile devices
- PWA support for offline capability

---

## 🔗 SHAREPOINT INTEGRATION

### Configuration
```env
SHAREPOINT_TENANT_ID=your_tenant_id
SHAREPOINT_CLIENT_ID=your_client_id
SHAREPOINT_CLIENT_SECRET=your_secret
SHAREPOINT_SITE_ID=your_site_id
```

### Folder Structure
```
/Madio ERP/
├── Chat Media/
│   ├── General/
│   ├── Project-{project_name}/
│   └── Department-{dept_name}/
├── Project Documents/
│   └── {project_name}/
├── Invoices/
│   └── {YYYY}/{MM}/
└── Expense Receipts/
    └── {YYYY}/{MM}/
```

### Implementation
- Use Microsoft Graph API
- Get access token with MSAL
- Upload files via REST API
- Store SharePoint URL + metadata in MongoDB
- Provide download links in UI

---

## 📊 REPORTING REQUIREMENTS

### Finance Reports
- Monthly expense summary by category
- Petty cash approval turnaround time
- Budget vs actual comparison
- Outstanding invoices aging report

### Project Reports
- Project status dashboard
- Task completion rate by team member
- Project profitability analysis
- Resource utilization report

### Export Formats
- Excel (.xlsx) - Using openpyxl
- PDF - Using ReportLab or WeasyPrint
- CSV - For data imports

---

## 🚀 DEPLOYMENT REQUIREMENTS

### Docker Setup
```yaml
services:
  backend:
    - FastAPI with Gunicorn
    - 4 workers
    - Health checks enabled
  
  redis:
    - For rate limiting and caching
    - Persistent storage
  
  prometheus:
    - Metrics collection
  
  grafana:
    - Monitoring dashboards
```

### Environment Setup
```env
# Required Environment Variables
MONGODB_URI=mongodb+srv://...
JWT_SECRET_KEY=64-character-random-string
SHAREPOINT_TENANT_ID=...
SHAREPOINT_CLIENT_ID=...
SHAREPOINT_CLIENT_SECRET=...
REDIS_HOST=redis
REDIS_PORT=6379
```

---

## ✅ ACCEPTANCE CRITERIA

### Must Have (Phase 1-3)
- [ ] User can login and see dashboard
- [ ] User can create and approve petty cash requests
- [ ] User can create projects and assign tasks
- [ ] User can send messages in chat rooms
- [ ] User can upload files from mobile/desktop
- [ ] Files automatically upload to SharePoint
- [ ] User can download files from chat history
- [ ] Mobile-responsive on all pages
- [ ] Role-based access working

### Nice to Have (Phase 4)
- [ ] Real-time notifications
- [ ] Advanced reporting with charts
- [ ] Bulk import/export
- [ ] Email notifications
- [ ] WhatsApp Business API integration
- [ ] Audit logs for all actions

---

## 📝 DELIVERABLES

1. **Code Repository**
   - All source code pushed to GitHub
   - Clear commit messages
   - Branch: `feature/production-enhancements`

2. **Documentation**
   - Setup guide (README.md)
   - API documentation (auto-generated from FastAPI)
   - Database schema documentation
   - Deployment guide

3. **Configuration Files**
   - .env.example with all variables
   - docker-compose.yml
   - Dockerfile
   - nginx configuration

4. **Testing**
   - Manual test all major user flows
   - Fix critical bugs
   - Ensure mobile responsiveness

---

## 💰 COST OPTIMIZATION NOTES

**To minimize development time and cost:**

1. **Reuse existing code** from `feature/production-enhancements` branch
   - WhatsApp service already exists
   - SharePoint service already exists
   - JWT authentication already implemented
   - Database connection pooling ready

2. **Use Material-UI components** - Don't build from scratch
   - DataGrid for tables
   - Dialog for modals
   - Card for layouts
   - Built-in form validation

3. **Focus on core features first** - Skip advanced features initially
   - Start with basic chat (no reactions, no voice messages)
   - Simple charts (no complex visualizations)
   - Basic reports (no custom templates)

4. **Leverage existing libraries**
   - date-fns for date formatting
   - axios for API calls
   - recharts for simple charts
   - react-router-dom for navigation

5. **Test incrementally** - Test each module before moving to next

---

## 🎯 SUCCESS METRICS

**The system is production-ready when:**
- All Phase 1-3 features are working
- No critical bugs in core flows
- Mobile chat works smoothly
- Files upload to SharePoint successfully
- Load time < 3 seconds on good connection
- Can handle 50 concurrent users
- All security measures implemented

---

## 📞 SUPPORT & RESOURCES

- **Existing Code:** https://github.com/jags8/madio-erp-platinum
- **Material-UI Docs:** https://mui.com/
- **FastAPI Docs:** https://fastapi.tiangolo.com/
- **Microsoft Graph API:** https://docs.microsoft.com/en-us/graph/

---

## 🚦 START HERE

1. **Clone the repository:**
   ```bash
   git clone https://github.com/jags8/madio-erp-platinum.git
   cd madio-erp-platinum
   git checkout feature/production-enhancements
   ```

2. **Review existing code:**
   - Check `backend/services/sharepoint_service.py`
   - Check `backend/services/whatsapp_service.py`
   - Check `backend/auth/jwt_handler.py`
   - Check `frontend/src/components/WhatsApp/`

3. **Start with Phase 1:**
   - Create database collections
   - Setup authentication
   - Build basic dashboard

4. **Move to Phase 2 & 3:**
   - Implement finance module
   - Implement project management
   - Build chat interface

5. **Test everything on mobile and desktop**

---

**TARGET COMPLETION:** All core features (Phase 1-3) working within budget

**PRIORITY:** Chat with SharePoint integration is CRITICAL - this must work flawlessly on mobile

---

END OF PROMPT

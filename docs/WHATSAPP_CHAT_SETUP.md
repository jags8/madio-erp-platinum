# WhatsApp Chat Module - Setup Guide

## 📱 Complete WhatsApp-Style Chat Interface

A production-ready WhatsApp-like chat interface integrated into Madio ERP with:
- Real-time messaging
- Media sharing (images, videos, documents)
- SharePoint automatic backup
- Entity linking (projects, petty cash, leads)
- Message status tracking
- Conversation management

---

## 🎯 Features

### User Interface
- ✅ **WhatsApp-style design** - Familiar green theme and layout
- ✅ **Conversation list** - All chats in sidebar with unread badges
- ✅ **Real-time updates** - Auto-refresh every 3-5 seconds
- ✅ **Message bubbles** - Sent (green) and received (white)
- ✅ **Status indicators** - Sent (✓), Delivered (✓✓), Read (blue ✓✓)
- ✅ **Media preview** - Images, videos inline; documents as chips
- ✅ **File attachments** - Drag-drop or click to upload
- ✅ **Search conversations** - Filter by phone number
- ✅ **Timestamps** - Relative time display

### Backend Features
- ✅ **WhatsApp Business API** - Official API integration
- ✅ **SharePoint sync** - Auto-upload all media
- ✅ **Entity linking** - Connect messages to projects/leads
- ✅ **Webhook handling** - Receive incoming messages
- ✅ **Message history** - Unlimited conversation storage
- ✅ **Statistics** - Usage analytics and metrics

---

## 🚀 Quick Start

### 1. Prerequisites

**Required:**
- WhatsApp Business API access (apply at Meta)
- MongoDB database
- Redis server
- Node.js 18+ and React

**Optional:**
- SharePoint/Microsoft 365 subscription
- Azure AD app registration

### 2. Backend Setup

```bash
# Install dependencies
cd backend
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
```

**Edit `.env` with WhatsApp credentials:**
```env
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_ACCESS_TOKEN=your_permanent_access_token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=random_secure_token
```

**For SharePoint integration (optional):**
```env
SHAREPOINT_TENANT_ID=your_tenant_id
SHAREPOINT_CLIENT_ID=your_app_client_id
SHAREPOINT_CLIENT_SECRET=your_app_secret
SHAREPOINT_SITE_ID=your_site_id
```

### 3. Database Initialization

```bash
# Create indexes for performance
python backend/scripts/init_whatsapp_db.py
```

This creates:
- `whatsapp_messages` collection with indexes
- `whatsapp_entity_links` collection
- `refresh_tokens` collection

### 4. Frontend Setup

```bash
cd frontend
npm install
npm start
```

**Access the chat:**
- Navigate to: `http://localhost:3000/whatsapp-chat`
- Or add to your navigation menu

---

## 🔧 Configuration

### WhatsApp Business API Setup

#### Step 1: Create Meta Business Account
1. Go to [Facebook Business](https://business.facebook.com)
2. Create or select business account
3. Navigate to **WhatsApp > API Setup**

#### Step 2: Get Phone Number
1. Add phone number to WhatsApp Business
2. Complete verification
3. Copy **Phone Number ID**

#### Step 3: Generate Access Token
1. Go to **System Users** in Business Settings
2. Create system user with admin access
3. Generate permanent token
4. Add permissions: `whatsapp_business_messaging`, `whatsapp_business_management`

#### Step 4: Configure Webhook

**Webhook URL:**
```
https://your-domain.com/api/whatsapp/webhook
```

**Verify Token:** Use the same value as `WHATSAPP_WEBHOOK_VERIFY_TOKEN`

**Subscribe to:**
- `messages`
- `message_status`

### SharePoint Integration (Optional)

#### Step 1: Create App Registration
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory > App registrations**
3. Click **New registration**
4. Name: "Madio ERP WhatsApp Integration"

#### Step 2: Grant Permissions
Add **Microsoft Graph** permissions:
- `Sites.ReadWrite.All`
- `Files.ReadWrite.All`

#### Step 3: Create Client Secret
1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Copy the secret value (shown only once)

#### Step 4: Get Site ID
```bash
# Using Microsoft Graph Explorer
GET https://graph.microsoft.com/v1.0/sites?search=YourSiteName
```

---

## 💻 Usage

### Basic Messaging

**Send text message:**
```javascript
const response = await axios.post('/api/whatsapp/send-message', {
  to_phone: '+919876543210',
  message: 'Hello from Madio ERP!'
});
```

**Send image:**
```javascript
const response = await axios.post('/api/whatsapp/send-media', {
  to_phone: '+919876543210',
  media_url: 'https://example.com/image.jpg',
  media_type: 'image',
  caption: 'Check this out!'
});
```

### Entity Linking

Link messages to ERP entities:

```javascript
// Send message linked to project
await axios.post('/api/whatsapp/send-message', {
  to_phone: '+919876543210',
  message: 'Project update: Work completed',
  link_to_entity: 'project_123',
  entity_type: 'project'
});

// Retrieve all messages for a project
const messages = await axios.get(
  '/api/whatsapp/entity-messages/project/project_123'
);
```

**Supported entity types:**
- `project` - Project management
- `petty_cash` - Petty cash requests
- `lead` - Sales leads
- `employee` - Employee records

### From UI Components

**Integrate into Project Details:**
```jsx
import WhatsAppChat from './components/WhatsApp';

function ProjectDetails({ projectId }) {
  return (
    <div>
      <h2>Project Communication</h2>
      <WhatsAppChat 
        filterEntity="project"
        entityId={projectId}
      />
    </div>
  );
}
```

---

## 📊 Monitoring & Analytics

### View Statistics

```bash
GET /api/whatsapp/stats?days=30
```

**Response:**
```json
{
  "total_messages": 1250,
  "unique_conversations": 45,
  "breakdown": [
    {"direction": "outbound", "type": "text", "count": 800},
    {"direction": "inbound", "type": "text", "count": 350},
    {"direction": "outbound", "type": "image", "count": 100}
  ],
  "period_days": 30
}
```

### Prometheus Metrics

Metrics automatically tracked:
- `whatsapp_messages_total{direction,type}`
- `sharepoint_uploads_total{status}`
- Message send/receive latency

---

## 🔒 Security

### Authentication
- All endpoints require JWT bearer token
- Tokens expire after 30 minutes
- Refresh token rotation enabled

### Rate Limiting
- 100 requests per minute per user
- Webhook has separate rate limit (unlimited)

### Data Protection
- All messages encrypted in transit (TLS)
- Media files stored in secure SharePoint
- No message content in logs

---

## 🐛 Troubleshooting

### Messages Not Sending

**Check:**
1. WhatsApp token is valid (test in Graph API Explorer)
2. Phone number format: `+[country_code][number]` (e.g., `+919876543210`)
3. Recipient has WhatsApp account
4. Message templates approved (if using templates)

**Debug:**
```bash
# Check logs
tail -f /var/log/madio-erp/application.log | grep whatsapp
```

### Webhook Not Receiving

**Verify:**
1. Webhook URL is publicly accessible (use ngrok for local)
2. SSL certificate is valid
3. Verify token matches in Meta console and `.env`
4. Subscribed to correct webhook events

**Test webhook:**
```bash
curl -X POST https://your-domain.com/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{"entry":[{"changes":[{"value":{"messages":[{"from":"1234567890","text":{"body":"test"}}]}}]}]}'
```

### SharePoint Upload Failing

**Check:**
1. App permissions granted and admin consented
2. Client secret not expired
3. Site ID is correct
4. Folder path exists: `/Madio ERP/WhatsApp Media`

---

## 📦 Database Schema

### whatsapp_messages
```javascript
{
  _id: ObjectId,
  whatsapp_message_id: String,    // WhatsApp's message ID
  from_phone: String,
  to_phone: String,
  other_party: String,             // Phone number of other party
  from_user_id: ObjectId,          // Internal user ID (if outbound)
  message_type: String,            // text, image, video, document
  message_body: String,
  direction: String,               // inbound, outbound
  status: String,                  // sent, delivered, read, failed
  read: Boolean,
  read_at: Date,
  media_url: String,               // SharePoint URL if media
  created_at: Date
}
```

### whatsapp_entity_links
```javascript
{
  _id: ObjectId,
  message_id: String,              // WhatsApp message ID
  entity_id: String,               // Project ID, Lead ID, etc.
  entity_type: String,             // project, lead, petty_cash
  created_at: Date
}
```

---

## 🎉 Success!

You now have a fully functional WhatsApp chat interface!

**Next Steps:**
1. Customize the UI theme to match your brand
2. Add message templates for common notifications
3. Set up automated responses (chatbot)
4. Configure alerts for important messages
5. Create WhatsApp dashboards in Grafana

---

## 📞 Support

- **Documentation**: [Full API Docs](http://localhost:8000/docs)
- **WhatsApp API**: [Meta Developers](https://developers.facebook.com/docs/whatsapp)
- **Issues**: [GitHub Issues](https://github.com/jags8/madio-erp-platinum/issues)

**Status**: ✅ Production Ready  
**Version**: 1.0.0

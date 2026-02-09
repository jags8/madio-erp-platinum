# Madio ERP Platinum - Production Ready

🚀 Enterprise-grade ERP system with WhatsApp Business API integration and automatic SharePoint file synchronization.

## Features

### Core Features
- ✅ **Master Data Management** - Centralized configuration for all business entities
- ✅ **Employee 360° Dashboard** - Complete employee profile with activity tracking
- ✅ **Petty Cash Workflow** - Digital approval process with multi-level authorization
- ✅ **Project Management** - Track projects, orders, and deliverables
- ✅ **Lead Management** - CRM functionality with follow-up tracking

### Production Enhancements
- 🔐 **JWT Authentication** with refresh token rotation
- 📱 **WhatsApp Business API** - Send/receive messages with automatic media backup
- 📁 **SharePoint Integration** - Auto-upload WhatsApp media to document libraries
- 🛡️ **Rate Limiting** - Redis-backed API throttling (100 req/min)
- 📊 **Prometheus Metrics** - Real-time monitoring and alerting
- 🏥 **Health Checks** - Kubernetes-ready liveness/readiness probes
- 📝 **Structured Logging** - JSON format for easy aggregation
- 🔄 **Database Pooling** - Optimized MongoDB connections

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for frontend development)
- Python 3.11+ (for backend development)

### 1. Clone Repository
```bash
git clone https://github.com/jags8/madio-erp-platinum.git
cd madio-erp-platinum
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Start with Docker
```bash
docker-compose up -d
```

### 4. Access Application
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/password from .env)

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive production setup guide.

### Quick Production Checklist
- [ ] Set strong JWT secrets (64+ characters)
- [ ] Configure CORS for production domains only
- [ ] Enable SSL/TLS certificates
- [ ] Set up MongoDB Atlas with replica sets
- [ ] Configure Redis with authentication
- [ ] Apply for WhatsApp Business API
- [ ] Create SharePoint app registration
- [ ] Set up monitoring dashboards
- [ ] Configure automated backups
- [ ] Enable error tracking (Sentry)

## Architecture

```
┌─────────────┐
│   Users     │
└──────┬──────┘
       │
       ↓
┌─────────────────────────────────────┐
│          Nginx (Reverse Proxy)      │
│  - SSL Termination                  │
│  - Rate Limiting                    │
│  - Static File Serving              │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│     FastAPI Backend (Gunicorn)      │
│  - JWT Authentication               │
│  - WhatsApp Integration             │
│  - Business Logic                   │
└────┬──────────────┬─────────────────┘
     │              │
     ↓              ↓
┌──────────┐  ┌───────────────┐
│ MongoDB  │  │     Redis     │
│  Atlas   │  │  (Caching &   │
│          │  │ Rate Limiting)│
└──────────┘  └───────────────┘
```

## WhatsApp Integration

### Setup WhatsApp Business API
1. Create Meta Business Account
2. Apply for WhatsApp Business API
3. Complete business verification
4. Get Phone Number ID and Access Token
5. Configure webhook: `https://your-domain.com/api/whatsapp/webhook`
6. Submit message templates for approval

### SharePoint Integration
1. Go to Azure Portal
2. Create App Registration
3. Grant permissions: `Sites.ReadWrite.All`, `Files.ReadWrite.All`
4. Create client secret
5. Add credentials to `.env`

## API Documentation

Full API documentation available at `/docs` when running.

### Key Endpoints

**Authentication**
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout and revoke tokens

**WhatsApp**
- `POST /api/whatsapp/send-message` - Send text message
- `POST /api/whatsapp/send-media` - Send image/video/document
- `GET /api/whatsapp/conversations` - List conversations
- `POST /api/whatsapp/webhook` - Webhook for incoming messages

**Health & Monitoring**
- `GET /health` - Basic health check
- `GET /health/ready` - Readiness probe
- `GET /metrics` - Prometheus metrics

## Development

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python server.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Run Tests
```bash
cd backend
pytest tests/
```

## Monitoring

### Prometheus Metrics
- HTTP request count and latency
- Database query performance
- WhatsApp message volume
- System resource usage (CPU, memory, disk)

### Grafana Dashboards
Pre-configured dashboards for:
- API performance monitoring
- Error rate tracking
- WhatsApp message analytics
- System health overview

## Security

- **Authentication**: JWT with refresh token rotation
- **Rate Limiting**: 100 requests per minute per user
- **CORS**: Restricted to production domains
- **Encryption**: TLS 1.2+ for all connections
- **Secrets**: Never committed to repository
- **Audit Logging**: All critical operations logged

## Backup & Recovery

### Automated Backups
- Daily MongoDB backups at 2 AM IST
- 30-day retention policy
- Stored in cloud (S3/Azure Blob)

### Manual Backup
```bash
mongodump --uri="$MONGODB_URI" --out=backup_$(date +%Y%m%d)
```

### Restore
```bash
mongorestore --uri="$MONGODB_URI" --drop backup_20260209/
```

## Support

- **Documentation**: [Full Documentation](./docs/)
- **Issues**: [GitHub Issues](https://github.com/jags8/madio-erp-platinum/issues)
- **Email**: support@madio.in

## License

Proprietary - © 2026 Madio

## Contributors

- Jagadeesh K - Founder & Lead Developer

---

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Last Updated**: February 9, 2026

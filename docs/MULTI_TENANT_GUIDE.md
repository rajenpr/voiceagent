# Multi-Tenant Voice AI Platform - Complete Guide

## Overview

This guide covers running your Voice AI platform as a **multi-tenant SaaS business** where:
- Multiple clients from different industries use your service
- Each client gets their own dedicated Twilio phone number
- Each phone number is configured once and works forever
- You manage everything from a centralized admin dashboard

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Your SaaS Platform                         │
│            (Hosted on Hostinger VPS)                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Client A (Dental Office)                                   │
│  ├─ Session ID: abc123                                      │
│  ├─ Phone: +1-800-111-1111                                  │
│  ├─ Webhook: http://YOUR_IP:8000/api/.../abc123            │
│  └─ Configuration: Dental-specific prompts                  │
│                                                              │
│  Client B (Law Firm)                                        │
│  ├─ Session ID: def456                                      │
│  ├─ Phone: +1-800-222-2222                                  │
│  ├─ Webhook: http://YOUR_IP:8000/api/.../def456            │
│  └─ Configuration: Legal-specific prompts                   │
│                                                              │
│  Client C (Real Estate)                                     │
│  ├─ Session ID: ghi789                                      │
│  ├─ Phone: +1-800-333-3333                                  │
│  ├─ Webhook: http://YOUR_IP:8000/api/.../ghi789            │
│  └─ Configuration: Real estate-specific prompts             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Business Model

### Your Pricing (from PricingSection.tsx)
- **Starter Plan**: $99/month (200 calls)
- **Professional Plan**: $299/month (750 calls)
- **Enterprise Plan**: Custom pricing

### Your Costs Per Client
```
Fixed Monthly Costs:
├─ Twilio Phone Number: $1.15/month
└─ VPS Hosting: Shared across all clients

Variable Costs (Per Call):
├─ Twilio Voice: ~$0.026/minute (avg 1.5 min call = $0.039)
├─ Groq LLM API: ~$0.0005/call
└─ Total per call: ~$0.04

Profit Margins:
├─ Starter ($99): 200 calls × $0.04 = $8 cost → 92% margin ✅
├─ Professional ($299): 750 calls × $0.04 = $30 cost → 90% margin ✅
└─ Your monthly profit per client: $70-270
```

### Revenue Scaling Example
```
10 clients (average $199/month):
├─ Monthly Revenue: $1,990
├─ Fixed Costs: $11.50 (phone numbers)
├─ Variable Costs: ~$200 (if all use 500 calls/month)
└─ Profit: ~$1,778/month (~89% margin)

50 clients:
├─ Monthly Revenue: $9,950
├─ Fixed Costs: $57.50
├─ Variable Costs: ~$1,000
└─ Profit: ~$8,892/month (~89% margin)

100 clients:
├─ Monthly Revenue: $19,900
├─ Fixed Costs: $115
├─ Variable Costs: ~$2,000
└─ Profit: ~$17,785/month (~89% margin)
```

## Initial Platform Setup

### 1. Deploy Backend on VPS

```bash
# SSH into your Hostinger VPS
ssh user@YOUR_VPS_IP

# Clone repository
git clone https://github.com/yourusername/voiceagent.git
cd voiceagent/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
nano .env
```

### 2. Configure .env File

```bash
# Groq API (LLM)
GROQ_API_KEY=gsk_xxxxxxxxxxxx

# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxx
# Note: TWILIO_PHONE_NUMBER not needed - each client has their own

# Base URL (your VPS IP)
BASE_URL=http://YOUR_VPS_IP:8000

# Optional: Deepgram (if using for STT instead of Twilio's built-in)
DEEPGRAM_API_KEY=xxxxxxxxxx

# Database
CHROMA_PERSIST_DIRECTORY=./data/chroma
UPLOAD_DIRECTORY=./data/uploads
```

### 3. Start Backend Server

```bash
# Option A: Run directly (for testing)
python -m app.main

# Option B: Run with systemd (production)
# See IP_ADDRESS_SETUP.md for systemd configuration

# Verify it's running
curl http://YOUR_VPS_IP:8000/
# Should return: {"status": "healthy", ...}
```

### 4. Open Firewall

```bash
sudo ufw allow 8000/tcp
sudo ufw status
```

## Client Onboarding Workflow

### Method 1: Automated Provisioning Script (Recommended)

```bash
# Navigate to backend directory
cd /home/user/voiceagent/backend

# Activate virtual environment
source venv/bin/activate

# Run provisioning script
python provision_client.py \
  --business-name "Smith Dental Office" \
  --industry "Healthcare" \
  --goal "Book Appointments" \
  --area-code "415"
```

**What this script does automatically:**
1. ✅ Creates session with unique session_id
2. ✅ Purchases Twilio phone number (optional)
3. ✅ Configures webhook URLs automatically
4. ✅ Outputs client details and phone number
5. ✅ Saves client record to file

**Example output:**
```
======================================================================
✅ CLIENT PROVISIONED SUCCESSFULLY
======================================================================

📋 Client Details:
   Business Name: Smith Dental Office
   Session ID: 7c3f2e1a-9b4d-4e8f-a5c6-3d7f9e2b1c4a
   Phone Number: +14155551234

🔗 Webhook URLs:
   Voice: http://123.45.67.89:8000/api/twilio/voice/incoming/7c3f2e1a-...
   Status: http://123.45.67.89:8000/api/twilio/voice/status

📞 Client Instructions:
   Give your client this phone number: +14155551234
   They can start receiving calls immediately!

💰 Monthly Costs:
   Twilio Phone: $1.15/month
   Per-call cost: ~$0.04 (Twilio + Groq)
   Your pricing: $99-299/month
   Profit margin: ~90%

======================================================================
```

### Method 2: Manual Provisioning (Step by Step)

#### Step 1: Create Session

```bash
curl -X POST http://YOUR_VPS_IP:8000/api/session/create \
  -H "Content-Type: application/json" \
  -d '{
    "business_name": "Smith Dental Office",
    "industry": "Healthcare",
    "primary_goal": "Book Appointments"
  }'
```

**Response:**
```json
{
  "success": true,
  "session_id": "7c3f2e1a-9b4d-4e8f-a5c6-3d7f9e2b1c4a",
  "message": "Session created for Smith Dental Office"
}
```

**Save this session_id!** You'll need it for the webhook configuration.

#### Step 2: Purchase Twilio Phone Number

1. Log into Twilio Console: https://console.twilio.com/
2. Navigate: **Phone Numbers → Buy a number**
3. Search by:
   - Country: United States
   - Capabilities: Voice ✅
   - Area code: (optional, e.g., 415 for San Francisco)
4. Click **Buy** on your preferred number
5. Monthly cost: **$1.15**

#### Step 3: Configure Webhook in Twilio

1. Go to: **Phone Numbers → Manage → Active numbers**
2. Click on the number you just purchased
3. Scroll to **Voice & Fax** section
4. Configure:

   **A Call Comes In:**
   - Dropdown: Select **Webhook**
   - Method: **POST**
   - URL:
     ```
     http://YOUR_VPS_IP:8000/api/twilio/voice/incoming/SESSION_ID
     ```
     *(Replace SESSION_ID with the actual ID from Step 1)*

   **Call Status Changes:**
   - URL:
     ```
     http://YOUR_VPS_IP:8000/api/twilio/voice/status
     ```
   - Method: **POST**

5. Click **Save Configuration** at the bottom

#### Step 4: Test the Number

Call the Twilio number from any phone. You should hear:

> "Hello! Thank you for calling Smith Dental Office. How can I help you today?"

## Managing Your Clients

### Admin API Endpoints

You have several admin endpoints to manage clients:

#### 1. List All Clients

```bash
curl http://YOUR_VPS_IP:8000/api/admin/clients
```

**Response:**
```json
{
  "success": true,
  "total_clients": 3,
  "clients": [
    {
      "session_id": "abc123",
      "business_name": "Smith Dental",
      "industry": "Healthcare",
      "primary_goal": "Book Appointments",
      "documents_count": 2,
      "created_at": "2025-01-15"
    },
    ...
  ]
}
```

#### 2. Get Client Statistics

```bash
curl http://YOUR_VPS_IP:8000/api/admin/client/SESSION_ID/stats
```

**Response:**
```json
{
  "success": true,
  "session_id": "abc123",
  "business_name": "Smith Dental",
  "industry": "Healthcare",
  "primary_goal": "Book Appointments",
  "documents_uploaded": 2,
  "active_calls": 1,
  "configuration": {...}
}
```

#### 3. Update Client Configuration

```bash
curl -X PUT http://YOUR_VPS_IP:8000/api/admin/client/SESSION_ID/config \
  -H "Content-Type: application/json" \
  -d '{
    "business_name": "Smith Dental (Updated)",
    "industry": "Healthcare",
    "primary_goal": "Book Appointments & Answer Questions"
  }'
```

#### 4. Platform Overview Statistics

```bash
curl http://YOUR_VPS_IP:8000/api/admin/stats/overview
```

**Response:**
```json
{
  "success": true,
  "platform_stats": {
    "total_clients": 15,
    "active_calls": 3,
    "estimated_monthly_revenue": "$2,985.00",
    "monthly_fixed_costs": "$17.25",
    "estimated_profit_margin": "~90%"
  },
  "recent_clients": [...]
}
```

### Client Records

Each provisioned client is saved to:
```
/backend/client_SESSION_ID.json
```

Example:
```json
{
  "session_id": "7c3f2e1a-9b4d-4e8f-a5c6-3d7f9e2b1c4a",
  "phone_number": "+14155551234",
  "webhook_url": "http://123.45.67.89:8000/api/twilio/voice/incoming/7c3f2e1a..."
}
```

## Delivering Service to Clients

### What You Give Each Client:

```
📞 Phone Number: +1-415-555-1234

📋 Instructions:
1. Forward your business phone to this number, OR
2. Display this number on your website/marketing
3. Calls are answered 24/7 by AI
4. Appointments are booked automatically

🎯 Customized for your business:
- Dental appointment booking
- Office hours and services knowledge
- Natural, professional conversations
```

### Optional: Custom Knowledge Base

If a client wants specific information (services, pricing, FAQs), upload documents:

```bash
curl -X POST http://YOUR_VPS_IP:8000/api/upload/SESSION_ID \
  -F "files=@dental_services.pdf" \
  -F "files=@pricing.pdf"
```

The AI will use this knowledge when answering calls.

## Monitoring and Maintenance

### View Twilio Call Logs

1. Log into Twilio Console
2. Navigate: **Monitor → Logs → Calls**
3. Filter by phone number to see client-specific calls
4. View:
   - Call duration
   - Transcripts (if enabled)
   - Costs
   - Any errors

### Check Backend Logs

```bash
# If running with systemd
sudo journalctl -u voiceagent -f

# If running directly
tail -f backend.log
```

### Monthly Billing Reconciliation

```bash
# Get platform statistics
curl http://YOUR_VPS_IP:8000/api/admin/stats/overview

# Check Twilio usage
# Go to: https://console.twilio.com/us1/billing/usage
```

## Scaling Your Business

### When to Upgrade VPS

Monitor these metrics:
- **CPU usage** > 70% consistently
- **Memory usage** > 80%
- **Concurrent calls** > 20

Hostinger VPS tiers:
- VPS 1: 1 CPU, 4GB RAM (~10-20 concurrent clients)
- VPS 2: 2 CPU, 8GB RAM (~30-50 concurrent clients)
- VPS 3: 4 CPU, 16GB RAM (~100+ concurrent clients)

### Automation Opportunities

As you scale to 50+ clients, consider:

1. **Client Portal** (frontend dashboard):
   - Self-service onboarding
   - View call logs
   - Update business info
   - Upload documents

2. **Webhook Management UI**:
   - Automated Twilio phone provisioning via API
   - One-click webhook configuration
   - No manual Twilio console steps

3. **Payment Integration**:
   - Stripe subscription billing
   - Usage-based pricing (per call)
   - Automatic renewal

4. **Call Analytics Dashboard**:
   - Track calls per client
   - Average call duration
   - Peak hours
   - Customer sentiment

## Troubleshooting

### Client Reports Issues

**Problem**: "Calls aren't being answered"

**Diagnosis:**
```bash
# 1. Check if backend is running
curl http://YOUR_VPS_IP:8000/
# Should return: {"status": "healthy"}

# 2. Check Twilio webhook configuration
# Go to: Twilio Console → Phone Numbers → [Client's Number]
# Verify webhook URL matches their session_id

# 3. Check Twilio debugger
# Go to: https://console.twilio.com/us1/monitor/logs/debugger
# Look for recent errors for that phone number

# 4. Test manually
curl -X POST "http://YOUR_VPS_IP:8000/api/twilio/voice/incoming/SESSION_ID" \
  -d "CallSid=TEST123" \
  -d "From=+15555555555"
```

**Problem**: "AI doesn't know about my business"

**Solution:**
```bash
# Upload knowledge base documents
curl -X POST http://YOUR_VPS_IP:8000/api/upload/SESSION_ID \
  -F "files=@business_info.pdf"

# Or update configuration
curl -X PUT http://YOUR_VPS_IP:8000/api/admin/client/SESSION_ID/config \
  -H "Content-Type: application/json" \
  -d '{...updated config...}'
```

### Webhook URL Changed?

**Never!** Once configured, the webhook URL is permanent for that client:
```
http://YOUR_VPS_IP:8000/api/twilio/voice/incoming/SESSION_ID
```

The session_id never changes, so the webhook never needs updating.

### Need to Change VPS IP?

If you move to a new server:

1. Update `BASE_URL` in `.env`:
   ```bash
   BASE_URL=http://NEW_IP:8000
   ```

2. Update **all** Twilio phone numbers' webhooks:
   ```bash
   # Use Twilio API to bulk update
   # Or manually update each in Twilio Console
   ```

3. Better solution: Use a domain name instead (see TWILIO_SETUP.md)

## Security Best Practices

### 1. API Authentication

Add authentication to admin endpoints:

```python
# In main.py, add middleware
from fastapi import Header, HTTPException

async def verify_admin_token(x_admin_token: str = Header(...)):
    if x_admin_token != os.getenv("ADMIN_API_TOKEN"):
        raise HTTPException(status_code=401, detail="Unauthorized")

# Apply to admin routes
@app.get("/api/admin/clients", dependencies=[Depends(verify_admin_token)])
```

### 2. HTTPS Setup

For production, use HTTPS:
- See IP_ADDRESS_SETUP.md for Nginx reverse proxy setup
- Or use a domain with Let's Encrypt SSL

### 3. Rate Limiting

Prevent abuse:
```python
# Install: pip install slowapi
from slowapi import Limiter
limiter = Limiter(key_func=lambda: request.client.host)

@app.post("/api/session/create")
@limiter.limit("5/minute")  # Max 5 sessions per minute per IP
async def create_session(...):
```

## Next Steps

1. ✅ Deploy backend on VPS
2. ✅ Provision your first test client
3. ✅ Make a test call to verify everything works
4. 🚀 Start onboarding real paying clients!
5. 📊 Build admin dashboard (optional)
6. 💰 Scale to 50+ clients

## Support Resources

- **Twilio Docs**: https://www.twilio.com/docs/voice
- **Groq API**: https://console.groq.com/docs
- **FastAPI**: https://fastapi.tiangolo.com/
- **Platform Setup**: See `TWILIO_SETUP.md` and `IP_ADDRESS_SETUP.md`

---

**You're now running a fully automated, multi-tenant Voice AI SaaS platform!** 🎉

Each new client takes ~5 minutes to onboard, earns you $70-270/month profit, and requires zero ongoing maintenance.

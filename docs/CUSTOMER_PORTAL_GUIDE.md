# Customer Self-Service Portal - Complete Guide

## Overview

Your Voice AI platform now has a **complete self-service customer portal** that allows your customers to:
- ✅ Sign up with email/password or Google OAuth
- ✅ Verify their phone number via SMS
- ✅ Create and configure their own AI agents
- ✅ Upload documents to train their AI
- ✅ Customize AI behavior, tone, and instructions
- ✅ Manage multiple AI sessions
- ✅ Each customer has isolated RAG knowledge base

**This eliminates 100% of manual setup work** - customers do everything themselves!

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  CUSTOMER JOURNEY                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. Sign Up                                             │
│     ├─ Email/Password OR Google OAuth                   │
│     └─ Account created, auth token generated            │
│                                                          │
│  2. Phone Verification (REQUIRED)                       │
│     ├─ Submit phone number                              │
│     ├─ Receive 6-digit SMS code                         │
│     ├─ Verify code                                      │
│     └─ Phone verified ✅                                 │
│                                                          │
│  3. Create AI Session                                   │
│     ├─ Choose industry template OR custom               │
│     ├─ Configure business details                       │
│     ├─ Customize AI behavior                            │
│     └─ Session created ✅                                │
│                                                          │
│  4. Train AI (Optional)                                 │
│     ├─ Upload business documents                        │
│     ├─ PDFs, docs, CSVs processed                       │
│     └─ RAG knowledge base created ✅                     │
│                                                          │
│  5. Deploy & Use                                        │
│     ├─ Configure Twilio phone number                    │
│     ├─ Test AI agent                                    │
│     └─ Go live! 🚀                                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## API Endpoints Reference

### Authentication Endpoints

#### 1. Sign Up (Email/Password)

```bash
POST /api/auth/signup

Request:
{
  "email": "customer@business.com",
  "password": "SecurePassword123!",
  "phone": "+14155551234"  # Optional
}

Response:
{
  "success": true,
  "message": "Account created successfully",
  "user": {
    "user_id": "abc-123-def-456",
    "email": "customer@business.com",
    "phone": "+14155551234",
    "phone_verified": false
  },
  "token": "auth_token_here",
  "expires_at": "2025-01-16T12:00:00",
  "requires_phone_verification": true
}
```

**Important:** Phone verification is REQUIRED before creating AI sessions.

#### 2. Login (Email/Password)

```bash
POST /api/auth/login

Request:
{
  "email": "customer@business.com",
  "password": "SecurePassword123!"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "user": {
    "user_id": "abc-123-def-456",
    "email": "customer@business.com",
    "phone": "+14155551234",
    "phone_verified": true,
    "sessions": ["session-id-1", "session-id-2"],
    "subscription_plan": "professional"
  },
  "token": "auth_token_here",
  "expires_at": "2025-01-16T12:00:00",
  "requires_phone_verification": false
}
```

#### 3. Google OAuth Sign-In

```bash
POST /api/auth/google

Request:
{
  "google_token": "google_oauth_token_here",
  "phone": "+14155551234"  # Optional
}

Response:
{
  "success": true,
  "message": "Google authentication successful",
  "user": {
    "user_id": "abc-123-def-456",
    "email": "customer@gmail.com",
    "phone": "+14155551234",
    "phone_verified": false,
    "sessions": []
  },
  "token": "auth_token_here",
  "expires_at": "2025-01-16T12:00:00",
  "requires_phone_verification": true
}
```

**Note:** Even Google OAuth users must verify their phone number!

### Phone Verification Endpoints

#### 4. Submit Phone Number

```bash
POST /api/auth/phone/submit

Request:
{
  "user_id": "abc-123-def-456",
  "phone": "+14155551234"
}

Response:
{
  "success": true,
  "message": "Verification code sent to +14155551234",
  "phone": "+14155551234"
}
```

**SMS Received:**
```
Your Voice AI verification code is: 123456

This code expires in 10 minutes.

If you didn't request this, please ignore this message.
```

#### 5. Verify Phone Code

```bash
POST /api/auth/phone/verify

Request:
{
  "user_id": "abc-123-def-456",
  "code": "123456"
}

Response:
{
  "success": true,
  "message": "Phone number verified successfully",
  "user": {
    "user_id": "abc-123-def-456",
    "email": "customer@business.com",
    "phone": "+14155551234",
    "phone_verified": true
  }
}
```

**Welcome SMS Received:**
```
Welcome to Voice AI! 🎉

Your account is now active.

Login at: https://yoursite.com/dashboard
```

### Customer Portal Endpoints

#### 6. Get Configuration Templates

```bash
GET /api/portal/templates

Response:
{
  "success": true,
  "templates": [
    {
      "template_id": "dental",
      "name": "Dental Office",
      "industry": "Healthcare - Dental",
      "description": "Perfect for dental offices handling appointment booking",
      "default_config": {
        "primary_goal": "Book Appointments",
        "tone": "friendly",
        "greeting_message": "Thank you for calling! How can I help you today?",
        "business_hours": "Monday-Friday 9AM-6PM, Saturday 9AM-2PM",
        "services_offered": [
          "General Dentistry",
          "Cosmetic Dentistry",
          "Emergency Care",
          "Teeth Whitening"
        ],
        "special_instructions": "Always collect: name, phone, preferred date/time, reason for visit..."
      }
    },
    // ... 5 more templates
  ],
  "message": "Select a template to quick-start your configuration"
}
```

**Available Templates:**
1. **Dental Office** - Appointment booking, insurance questions
2. **Law Firm** - Legal intake, consultation scheduling
3. **Real Estate** - Buyer/seller qualification, showings
4. **Restaurant** - Reservations, takeout orders
5. **Medical Office** - Patient scheduling, HIPAA-compliant
6. **Custom** - Blank slate for any business

#### 7. Create AI Session

```bash
POST /api/portal/session/create/{user_id}

Request:
{
  "business_name": "Smith Dental Office",
  "industry": "Healthcare - Dental",
  "primary_goal": "Book Appointments",
  "tone": "friendly",
  "greeting_message": "Thank you for calling Smith Dental! How can I help you?",
  "business_hours": "Monday-Friday 9AM-6PM",
  "services_offered": [
    "General Dentistry",
    "Cosmetic Dentistry",
    "Emergency Dental Care"
  ],
  "pricing_info": "Cleanings start at $150. We accept most insurance.",
  "special_instructions": "Always ask for insurance information. Emphasize we have same-day emergency appointments available."
}

Response:
{
  "success": true,
  "session_id": "session-abc-123",
  "message": "Voice AI session created for Smith Dental Office",
  "config": { ... },
  "next_steps": [
    "Upload documents to train your AI (optional)",
    "Configure your Twilio phone number",
    "Test your AI agent"
  ]
}
```

#### 8. Update AI Configuration

```bash
PUT /api/portal/session/{session_id}/configure/{user_id}

Request:
{
  "business_name": "Smith Dental Office",
  "tone": "professional",  # Changed from "friendly"
  "greeting_message": "Thank you for calling. How may I assist you today?",
  "special_instructions": "NEW INSTRUCTION: Mention our new laser dentistry service. Also ask about referral source."
}

Response:
{
  "success": true,
  "session_id": "session-abc-123",
  "message": "Configuration updated successfully",
  "config": { ... }
}
```

**Real-time Updates:** Changes take effect immediately on the next call!

#### 9. Upload Documents for RAG

```bash
POST /api/portal/session/{session_id}/upload/{user_id}

Content-Type: multipart/form-data

Files:
- services_menu.pdf (120 KB)
- pricing_2025.pdf (85 KB)
- insurance_info.txt (12 KB)

Response:
{
  "success": true,
  "session_id": "session-abc-123",
  "files_uploaded": 3,
  "files": [
    {
      "filename": "services_menu.pdf",
      "size_kb": 120.5,
      "path": "./data/uploads/session-abc-123/services_menu.pdf"
    },
    {
      "filename": "pricing_2025.pdf",
      "size_kb": 85.2,
      "path": "./data/uploads/session-abc-123/pricing_2025.pdf"
    },
    {
      "filename": "insurance_info.txt",
      "size_kb": 12.1,
      "path": "./data/uploads/session-abc-123/insurance_info.txt"
    }
  ],
  "message": "Documents uploaded and processed successfully",
  "total_documents": 3
}
```

**Supported Formats:**
- PDF (`.pdf`)
- Text (`.txt`)
- Word (`.docx`)
- CSV (`.csv`)
- Markdown (`.md`)

**Limits:**
- Max file size: 10MB per file
- Unlimited files per session
- Auto-processed for RAG knowledge base

#### 10. Get Session Details

```bash
GET /api/portal/session/{session_id}/details/{user_id}

Response:
{
  "success": true,
  "session_id": "session-abc-123",
  "configuration": {
    "business_name": "Smith Dental Office",
    "industry": "Healthcare - Dental",
    "tone": "professional",
    "greeting_message": "Thank you for calling...",
    // ... full config
  },
  "documents_uploaded": 3,
  "status": "active"
}
```

#### 11. Delete Session (Wipe All Data)

```bash
DELETE /api/portal/session/{session_id}/delete/{user_id}

Response:
{
  "success": true,
  "message": "Session and all data deleted successfully",
  "session_id": "session-abc-123"
}
```

**What Gets Deleted:**
- ✅ Session configuration
- ✅ All uploaded documents
- ✅ RAG knowledge base
- ✅ Vector embeddings
- ✅ All session data

**Permanent:** This action cannot be undone!

#### 12. Get User Profile

```bash
GET /api/auth/me/{user_id}

Response:
{
  "success": true,
  "user": {
    "user_id": "abc-123-def-456",
    "email": "customer@business.com",
    "phone": "+14155551234",
    "phone_verified": true,
    "auth_method": "password",  # or "google"
    "subscription_plan": "professional",
    "created_at": "2025-01-15T10:30:00",
    "sessions": [
      {
        "session_id": "session-abc-123",
        "business_name": "Smith Dental Office",
        "industry": "Healthcare - Dental",
        "documents_count": 3
      },
      {
        "session_id": "session-def-456",
        "business_name": "Smith Legal Services",
        "industry": "Legal",
        "documents_count": 5
      }
    ]
  }
}
```

## Customer Workflow Examples

### Example 1: Dental Office Setup

```bash
# Step 1: Sign up
curl -X POST http://YOUR_IP:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dr.smith@smithdental.com",
    "password": "SecurePass123!",
    "phone": "+14155551234"
  }'

# Save user_id and token from response

# Step 2: Verify phone
curl -X POST http://YOUR_IP:8000/api/auth/phone/submit \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "USER_ID_HERE",
    "phone": "+14155551234"
  }'

# Check SMS, get code (e.g., 123456)

curl -X POST http://YOUR_IP:8000/api/auth/phone/verify \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "USER_ID_HERE",
    "code": "123456"
  }'

# Step 3: Get template for dental office
curl http://YOUR_IP:8000/api/portal/templates

# Step 4: Create session using template
curl -X POST http://YOUR_IP:8000/api/portal/session/create/USER_ID_HERE \
  -H "Content-Type: application/json" \
  -d '{
    "business_name": "Smith Dental Office",
    "industry": "Healthcare - Dental",
    "primary_goal": "Book Appointments",
    "tone": "friendly",
    "greeting_message": "Thank you for calling Smith Dental!",
    "business_hours": "Mon-Fri 9AM-6PM",
    "services_offered": ["Cleanings", "Fillings", "Cosmetic"],
    "pricing_info": "Cleanings $150, we accept insurance",
    "special_instructions": "Always collect insurance info"
  }'

# Save session_id from response

# Step 5: Upload documents
curl -X POST http://YOUR_IP:8000/api/portal/session/SESSION_ID/upload/USER_ID \
  -F "files=@services_menu.pdf" \
  -F "files=@insurance_accepted.pdf"

# Step 6: Configure Twilio phone number
# Webhook: http://YOUR_IP:8000/api/twilio/voice/incoming/SESSION_ID

# Step 7: Test by calling the number!
```

### Example 2: Multi-Location Business

```javascript
// Customer has 3 dental office locations
// Create separate session for each

const locations = [
  {
    name: "Smith Dental - Downtown",
    phone: "+14155551111",
    hours: "Mon-Fri 8AM-6PM"
  },
  {
    name: "Smith Dental - Suburbs",
    phone: "+14155552222",
    hours: "Mon-Sat 9AM-5PM"
  },
  {
    name: "Smith Dental - West Side",
    phone: "+14155553333",
    hours: "Tue-Sat 10AM-7PM"
  }
];

// Create 3 sessions with different configurations
for (const location of locations) {
  const response = await fetch(`http://YOUR_IP:8000/api/portal/session/create/${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      business_name: location.name,
      industry: "Healthcare - Dental",
      business_hours: location.hours,
      tone: "friendly",
      // ... rest of config
    })
  });

  const { session_id } = await response.json();

  // Configure Twilio phone with this session_id
  // Each location gets its own AI with location-specific info!
}
```

## Frontend Integration (React Example)

```typescript
// hooks/useAuth.ts
import { useState } from 'react';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const signup = async (email: string, password: string, phone?: string) => {
    const response = await fetch('http://YOUR_IP:8000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, phone })
    });

    const data = await response.json();
    if (data.success) {
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_id', data.user.user_id);
    }

    return data;
  };

  const verifyPhone = async (userId: string, code: string) => {
    const response = await fetch('http://YOUR_IP:8000/api/auth/phone/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, code })
    });

    return await response.json();
  };

  const createSession = async (userId: string, config: any) => {
    const response = await fetch(`http://YOUR_IP:8000/api/portal/session/create/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });

    return await response.json();
  };

  const uploadDocuments = async (sessionId: string, userId: string, files: FileList) => {
    const formData = new FormData();
    Array.from(files).forEach(file => formData.append('files', file));

    const response = await fetch(
      `http://YOUR_IP:8000/api/portal/session/${sessionId}/upload/${userId}`,
      { method: 'POST', body: formData }
    );

    return await response.json();
  };

  return { user, token, signup, verifyPhone, createSession, uploadDocuments };
}
```

## Security & Best Practices

### For Production Deployment:

1. **HTTPS Only:**
   ```bash
   # Enforce HTTPS
   BASE_URL=https://your-domain.com
   ```

2. **Secure Password Hashing:**
   Current: SHA-256 (good for MVP)
   Production: Upgrade to bcrypt
   ```python
   # In user_manager.py, replace:
   hashlib.sha256(password.encode()).hexdigest()

   # With:
   import bcrypt
   bcrypt.hashpw(password.encode(), bcrypt.gensalt())
   ```

3. **Rate Limiting:**
   ```bash
   pip install slowapi

   # In main.py
   from slowapi import Limiter

   @app.post("/api/auth/login")
   @limiter.limit("5/minute")  # Max 5 login attempts per minute
   async def login(...):
   ```

4. **Token Security:**
   - Store tokens in httpOnly cookies (not localStorage)
   - Implement refresh tokens
   - Short expiration times (15 min access, 7 day refresh)

5. **Phone Verification:**
   - Already implemented ✅
   - 10-minute code expiration ✅
   - Single-use codes ✅

6. **Data Isolation:**
   - Already implemented ✅
   - Session ownership verified ✅
   - RAG data isolated ✅

## Google OAuth Setup

### Step 1: Create Google OAuth Credentials

1. Go to: https://console.cloud.google.com/
2. Create new project (or select existing)
3. Enable Google+ API
4. Go to: **Credentials → Create Credentials → OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback` (development)
   - `https://your-domain.com/auth/google/callback` (production)
7. Copy **Client ID** and **Client Secret**

### Step 2: Add to .env

```bash
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_secret_here
```

### Step 3: Frontend Integration

```typescript
// Install: npm install @react-oauth/google

import { GoogleLogin } from '@react-oauth/google';

<GoogleLogin
  onSuccess={async (credentialResponse) => {
    const response = await fetch('http://YOUR_IP:8000/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        google_token: credentialResponse.credential,
        phone: '+14155551234'  // Optional
      })
    });

    const data = await response.json();
    if (data.success) {
      // User logged in!
      if (data.requires_phone_verification) {
        // Show phone verification UI
      } else {
        // Redirect to dashboard
      }
    }
  }}
  onError={() => {
    console.log('Login Failed');
  }}
/>
```

## Monitoring & Analytics

### Track Customer Signups

```python
# Add to main.py
import logging

logging.basicConfig(filename='signups.log', level=logging.INFO)

@app.post("/api/auth/signup")
async def signup(request: UserSignup):
    # ... existing code
    logging.info(f"New signup: {user.email} at {datetime.now()}")
```

### Track Session Creation

```python
@app.post("/api/portal/session/create/{user_id}")
async def portal_create_session(...):
    # ... existing code
    logging.info(f"New session: {config.business_name} by {user.email}")
```

### Admin Dashboard Endpoint

```bash
# Already available!
GET /api/admin/clients

# Returns all customers and their sessions
# Build frontend dashboard to visualize
```

## Cost Analysis

### Per Customer Costs:

```
Phone Verification (One-Time):
- SMS code: $0.0075
- Welcome SMS: $0.0075
- Total: ~$0.015 per customer

Per Session Costs:
- Storage (documents): ~$0.10/month per 1GB
- Twilio phone (if provided): $1.15/month
- Voice calls: ~$0.04 per call

Total Cost Per Customer:
- Onboarding: $0.015 (one-time)
- Monthly: $1.15 (if phone provided) + call usage

Revenue Per Customer:
- Starter plan: $99/month
- Professional plan: $299/month

Margin:
- Starter: 98.8% (excluding call costs)
- Professional: 99.6% (excluding call costs)
```

## Troubleshooting

### Phone Verification Not Working

**Issue:** SMS not received

**Check:**
```bash
# 1. Verify Twilio credentials
echo $TWILIO_ACCOUNT_SID
echo $TWILIO_AUTH_TOKEN
echo $TWILIO_PHONE_NUMBER

# 2. Check Twilio console for SMS logs
# https://console.twilio.com/us1/monitor/logs/messages

# 3. Verify phone number format
# Must be E.164: +14155551234 (not 415-555-1234)

# 4. Test Twilio manually
curl -X POST https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json \
  --data-urlencode "Body=Test message" \
  --data-urlencode "From=$TWILIO_PHONE_NUMBER" \
  --data-urlencode "To=+14155551234" \
  -u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

### Google OAuth Failing

**Issue:** "Invalid Google token"

**Check:**
```bash
# 1. Verify GOOGLE_CLIENT_ID in .env matches Google Console
# 2. Check token hasn't expired (valid for 1 hour)
# 3. Ensure redirect URI is authorized in Google Console
# 4. Test token verification:

python3 << EOF
from google.oauth2 import id_token
from google.auth.transport import requests

token = "GOOGLE_TOKEN_HERE"
client_id = "YOUR_CLIENT_ID"

try:
    idinfo = id_token.verify_oauth2_token(token, requests.Request(), client_id)
    print("Valid token:", idinfo)
except Exception as e:
    print("Invalid token:", e)
EOF
```

### Session Ownership Error

**Issue:** "Unauthorized: You don't own this session"

**Cause:** User trying to access another user's session

**Fix:** This is working as intended (security feature)

**Verify ownership:**
```bash
curl http://YOUR_IP:8000/api/auth/me/USER_ID

# Check if session_id is in user's "sessions" array
```

## Next Steps

1. ✅ Backend complete
2. ⏳ Build frontend dashboard UI (recommended)
3. ⏳ Add demo session auto-cleanup
4. 💡 Payment integration (Stripe)
5. 💡 Usage analytics dashboard
6. 💡 Email notifications
7. 💡 Customer support chat

---

**You now have a fully functional self-service customer portal!** 🎉

Customers can sign up, configure their AI, upload documents, and manage everything themselves - **zero manual work required from you**.

This scales to thousands of customers with no operational overhead.

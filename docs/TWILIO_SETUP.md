# Twilio + Deepgram Setup Guide

This guide explains how to set up the phone-based voice AI system using Twilio for phone calls and Deepgram for speech recognition.

## 🎯 Why Twilio + Deepgram?

We upgraded from browser-based Web Speech API to Twilio phone calls for:

- ✅ **Enterprise-grade reliability** - No browser compatibility issues
- ✅ **Better speech recognition** - Deepgram's industry-leading STT
- ✅ **Real phone calls** - Familiar interface for all users
- ✅ **Consistent performance** - No network/browser variations

## 📋 Prerequisites

1. **Twilio Account** - [Sign up](https://www.twilio.com/try-twilio)
2. **Deepgram Account** - [Sign up](https://deepgram.com) (Free $200 credit)
3. **Groq API Key** - [Get key](https://console.groq.com)
4. **Public domain or ngrok** - For Twilio webhooks

---

## 🔧 Step 1: Set Up Twilio

### 1.1 Create Twilio Account

1. Go to [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Sign up for a free trial account ($15 free credit)
3. Verify your phone number

### 1.2 Get a Twilio Phone Number

1. In Twilio Console, go to **Phone Numbers** → **Manage** → **Buy a number**
2. Select your country
3. Choose a number with **Voice** capabilities
4. Click **Buy**

### 1.3 Get Your Twilio Credentials

From the Twilio Console dashboard, copy:
- **Account SID**: `ACxxxxxxxxxxxxxxxxxx`
- **Auth Token**: Click "Show" to reveal

---

## 🔧 Step 2: Set Up Deepgram

### 2.1 Create Deepgram Account

1. Go to [https://deepgram.com](https://deepgram.com)
2. Click "Get Started Free"
3. Sign up (you get $200 free credit)

### 2.2 Get API Key

1. Go to Deepgram Console
2. Click **API Keys** in the sidebar
3. Create a new API key
4. Copy the key (starts with `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

---

## 🔧 Step 3: Configure Environment Variables

Create/update `/backend/.env`:

```bash
# Groq API (for LLM)
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxx

# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+12345678901

# Deepgram Configuration
DEEPGRAM_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Base URL (your public domain or ngrok URL)
BASE_URL=https://your-domain.com
# OR for testing:
# BASE_URL=https://xxxx-xx-xx-xx-xx.ngrok-free.app

# Server Configuration
PORT=8000
HOST=0.0.0.0
DEBUG=True

# CORS Origins
CORS_ORIGINS=http://localhost:3000,https://your-domain.com

# RAG Configuration
CHROMA_PERSIST_DIRECTORY=./data/chroma
UPLOAD_DIRECTORY=./data/uploads
```

---

## 🔧 Step 4: Install Dependencies

```bash
cd /home/user/voiceagent/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

---

## 🔧 Step 5: Expose Your Backend (For Testing)

### Option A: Using ngrok (Recommended for testing)

```bash
# Install ngrok
brew install ngrok
# OR
sudo snap install ngrok

# Start ngrok
ngrok http 8000
```

Copy the HTTPS URL (e.g., `https://xxxx-xx-xx-xx-xx.ngrok-free.app`) and update `BASE_URL` in `.env`.

### Option B: Deploy to Production

Deploy to Hostinger VPS, AWS, or any hosting service with a public domain.

---

## 🔧 Step 6: Configure Twilio Webhooks

1. Go to Twilio Console → **Phone Numbers** → **Manage** → **Active numbers**
2. Click on your purchased number
3. Scroll to **Voice & Fax** section
4. Under **A CALL COMES IN**, configure:
   - **Webhook**: `https://your-domain.com/api/twilio/voice/incoming/{session_id}`
   - **HTTP**: `POST`

**Note:** Replace `{session_id}` with an actual session ID for testing, or implement dynamic routing in production.

### Alternative: Use TwiML Bins

For testing, you can use Twilio TwiML Bins:

1. Go to **Studio** → **TwiML Bins**
2. Create a new bin with:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>Welcome to Voice AI. This number is being configured.</Say>
</Response>
```

---

## 🔧 Step 7: Start the Backend

```bash
cd /home/user/voiceagent/backend
source venv/bin/activate
python -m app.main
```

Expected output:
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

---

## 🔧 Step 8: Test the System

### 8.1 Create a Session

```bash
curl -X POST http://localhost:8000/api/session/create \
  -H "Content-Type: application/json" \
  -d '{
    "business_name": "Test Dental Clinic",
    "industry": "Dental Office",
    "primary_goal": "Book Appointments"
  }'
```

Response:
```json
{
  "success": true,
  "session_id": "abc123...",
  "message": "Session created for Test Dental Clinic"
}
```

### 8.2 Update Twilio Webhook

Update your Twilio phone number's webhook to:
```
https://your-domain.com/api/twilio/voice/incoming/abc123...
```

(Replace `abc123...` with your actual session ID)

### 8.3 Make a Test Call

1. Call your Twilio number from your phone
2. You should hear: "Hello! Thank you for calling Test Dental Clinic. I'm an AI assistant. How can I help you today?"
3. Test the conversation flow

---

## 📊 Cost Breakdown

### Per Call Cost

| Service | Cost | Notes |
|---------|------|-------|
| **Twilio Voice** | $0.0085/min | Incoming calls to US number |
| **Groq API** | ~$0.0005 | LLM processing (~2K tokens) |
| **Deepgram STT** | Included | Free tier: 45,000 min/month |
| **Twilio TTS** | Included | Using built-in Polly voices |
| **Total** | **~$0.04/call** | Assuming 5-minute calls |

### Monthly Costs (100 customers, 750 calls each)

- Infrastructure: $20-100/month (Hostinger VPS)
- Twilio costs: ~$3,000/month (75,000 calls × $0.04)
- **Revenue**: $29,900/month (100 × $299 Professional plan)
- **Profit**: ~$26,800/month (89% margin!)

---

## 🔍 Troubleshooting

### Issue: "Session not found" error

**Solution:** Ensure you've created a session and updated the Twilio webhook URL with the correct session ID.

### Issue: Calls connect but no response

**Solutions:**
1. Check backend logs: `tail -f backend.log`
2. Verify `GROQ_API_KEY` is valid
3. Check Twilio webhook is receiving requests
4. Ensure `BASE_URL` is correct

### Issue: "Technical difficulties" message

**Solutions:**
1. Check if backend is running: `curl http://localhost:8000/`
2. Verify all environment variables are set
3. Check ngrok/domain is accessible from internet

### Issue: Deepgram errors

**Solutions:**
1. Verify `DEEPGRAM_API_KEY` is correct
2. Check you have credits remaining
3. Currently using Twilio's built-in TTS (Polly), so Deepgram is optional

---

## 🚀 Production Deployment

### 1. Deploy Backend

```bash
# On your Hostinger VPS or server
git clone your-repo
cd voiceagent/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Set environment variables
nano .env

# Run with systemd or supervisor
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 2. Set Up Domain

Point your domain to your server's IP address:
```
A Record: @ → your.server.ip.address
A Record: api → your.server.ip.address
```

### 3. Configure Nginx (Optional)

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 4. Enable HTTPS

```bash
sudo certbot --nginx -d api.yourdomain.com
```

### 5. Update Twilio Webhooks

Change webhook URLs to your production domain:
```
https://api.yourdomain.com/api/twilio/voice/incoming/{session_id}
```

---

## 📚 Next Steps

1. **Implement Session Management**: Create a dashboard to manage multiple sessions
2. **Add Call Recording**: Use Twilio's recording feature for quality assurance
3. **Implement Analytics**: Track call duration, success rate, etc.
4. **Add Deepgram TTS**: For higher quality voices (optional, adds cost)
5. **Scale Infrastructure**: Use load balancer for high call volumes

---

## 🆘 Support

- **Twilio Docs**: [https://www.twilio.com/docs/voice](https://www.twilio.com/docs/voice)
- **Deepgram Docs**: [https://developers.deepgram.com](https://developers.deepgram.com)
- **Groq Docs**: [https://console.groq.com/docs](https://console.groq.com/docs)

---

## 🎉 Success!

You now have an enterprise-grade phone-based voice AI system with:
- ✅ Reliable phone infrastructure (Twilio)
- ✅ Fast LLM responses (Groq)
- ✅ Optional advanced STT (Deepgram)
- ✅ 89% profit margins

Your voice AI is ready to handle real customer calls! 📞

# Setting Up Twilio with IP Address (No Domain Required)

This guide shows how to set up the voice AI system using only an IP address, without needing a domain name.

## ✅ What Works with Just an IP Address

Twilio webhooks work perfectly fine with IP addresses! You can use:
- `http://123.45.67.89:8000` for testing
- `https://123.45.67.89:8000` for production (with SSL)

## 🚀 Quick Setup

### Step 1: Get Your VPS IP Address

On your Hostinger VPS:
```bash
curl ifconfig.me
# Output: 123.45.67.89
```

### Step 2: Configure Environment

Edit `/backend/.env`:
```bash
# Your actual API keys
GROQ_API_KEY=gsk_your_actual_key_here
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+12345678901

# Use your VPS IP address
BASE_URL=http://123.45.67.89:8000

# Server config
PORT=8000
HOST=0.0.0.0
DEBUG=False

# CORS (update with your frontend URL)
CORS_ORIGINS=http://localhost:3000,http://123.45.67.89:3000
```

### Step 3: Open Firewall Port

```bash
# Check firewall status
sudo ufw status

# Allow port 8000
sudo ufw allow 8000/tcp

# Reload
sudo ufw reload

# Verify
sudo ufw status numbered
```

### Step 4: Start Backend

```bash
cd /home/user/voiceagent/backend

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start server
python -m app.main
```

### Step 5: Test Backend Accessibility

From your local computer:
```bash
curl http://YOUR_VPS_IP:8000/

# Should return:
# {"status":"healthy","service":"Voice AI Agent API","version":"1.0.0"}
```

### Step 6: Create Session

```bash
curl -X POST http://YOUR_VPS_IP:8000/api/session/create \
  -H "Content-Type: application/json" \
  -d '{
    "business_name": "Test Business",
    "industry": "Dental Office",
    "primary_goal": "Book Appointments"
  }'
```

Save the returned `session_id`!

### Step 7: Configure Twilio

1. Go to [Twilio Console](https://console.twilio.com/us1/develop/phone-numbers/manage/incoming)
2. Click your phone number
3. Under "Voice & Fax" → "A CALL COMES IN":
   - **URL**: `http://YOUR_VPS_IP:8000/api/twilio/voice/incoming/YOUR_SESSION_ID`
   - **Method**: POST
4. Click "Save configuration"

### Step 8: Test Call

Call your Twilio number. You should hear the AI greeting!

---

## 🔒 Production: Adding HTTPS

For production, you should use HTTPS. Here are options:

### Option 1: Nginx Reverse Proxy (Recommended)

```bash
# Install Nginx
sudo apt update
sudo apt install nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/voiceai
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name YOUR_VPS_IP;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and start:
```bash
sudo ln -s /etc/nginx/sites-available/voiceai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Allow port 80
sudo ufw allow 80/tcp
```

Now Twilio webhook becomes:
```
http://YOUR_VPS_IP/api/twilio/voice/incoming/SESSION_ID
```

### Option 2: Self-Signed Certificate

```bash
cd /home/user/voiceagent/backend

# Generate certificate
openssl req -x509 -newkey rsa:4096 \
  -keyout key.pem -out cert.pem \
  -days 365 -nodes \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=YOUR_VPS_IP"
```

Update `backend/app/main.py`:
```python
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        ssl_keyfile="key.pem",
        ssl_certfile="cert.pem"
    )
```

Update `.env`:
```bash
BASE_URL=https://YOUR_VPS_IP:8000
```

Allow port 8000:
```bash
sudo ufw allow 8000/tcp
```

**Note**: Twilio may show SSL warnings with self-signed certs, but it will still work.

---

## 🔄 Running Backend as a Service

To keep the backend running 24/7:

### Create systemd service

```bash
sudo nano /etc/systemd/system/voiceai.service
```

Add:
```ini
[Unit]
Description=Voice AI Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/home/user/voiceagent/backend
Environment="PATH=/home/user/voiceagent/backend/venv/bin"
ExecStart=/home/user/voiceagent/backend/venv/bin/python -m app.main
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable voiceai
sudo systemctl start voiceai

# Check status
sudo systemctl status voiceai

# View logs
sudo journalctl -u voiceai -f
```

---

## 📊 Testing Checklist

- [ ] VPS IP address found
- [ ] Port 8000 opened in firewall
- [ ] Backend starts without errors
- [ ] Health check works: `curl http://IP:8000/`
- [ ] Session created successfully
- [ ] Twilio webhook configured with IP + session ID
- [ ] Test call connects
- [ ] AI responds to speech
- [ ] Conversation flows naturally
- [ ] (Optional) HTTPS configured
- [ ] (Optional) Backend runs as service

---

## 🐛 Troubleshooting

### Backend not accessible from internet

```bash
# Check if backend is running
curl localhost:8000/

# Check if port is listening
sudo netstat -tlnp | grep 8000

# Check firewall
sudo ufw status

# Check if HOST is 0.0.0.0 in .env
cat .env | grep HOST
```

### Twilio can't reach webhook

1. Test from external location:
   ```bash
   curl http://YOUR_VPS_IP:8000/
   ```

2. Check Twilio debugger:
   - Go to [Twilio Console](https://console.twilio.com)
   - Click "Monitor" → "Logs" → "Errors"

3. Verify URL format:
   ```
   http://123.45.67.89:8000/api/twilio/voice/incoming/abc-123-def
   ```

### Call connects but no response

Check backend logs:
```bash
# If running directly
# Check terminal output

# If running as service
sudo journalctl -u voiceai -n 50
```

Common issues:
- GROQ_API_KEY not set or invalid
- Session ID in webhook doesn't match created session
- BASE_URL not matching actual IP

---

## 💰 Cost Comparison

### With IP Address (Your Setup)
- Domain: **$0/year** ✅
- SSL Certificate: **$0** (self-signed or Let's Encrypt)
- Hostinger VPS: **$20-50/month**
- **Total infrastructure: $20-50/month**

### With Custom Domain
- Domain: **$10-15/year**
- SSL Certificate: **$0** (Let's Encrypt)
- Hostinger VPS: **$20-50/month**
- **Total infrastructure: $22-52/month**

**Savings: ~$15/year by using IP only!**

---

## ✅ Production Checklist

For production deployment:

- [ ] Use HTTPS (Option 1 or 2 above)
- [ ] Run backend as systemd service
- [ ] Set DEBUG=False in .env
- [ ] Configure proper CORS origins
- [ ] Set up log rotation
- [ ] Monitor server resources
- [ ] Set up backup for session data
- [ ] Test failover scenarios
- [ ] Document your session IDs
- [ ] Set up monitoring/alerts

---

## 🎯 Next Steps

1. **Get your VPS IP**: `curl ifconfig.me`
2. **Update .env**: Replace BASE_URL
3. **Start backend**: `python -m app.main`
4. **Create session**: Use curl command above
5. **Configure Twilio**: Use IP-based webhook URL
6. **Test call**: Dial your Twilio number
7. **Deploy production**: Set up HTTPS + systemd service

You're ready to go! No domain needed. 🚀

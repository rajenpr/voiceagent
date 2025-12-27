# Voice AI SaaS - Quick Start Guide

Get your Voice AI platform up and running in under 10 minutes!

## Option 1: Automated Deployment (Recommended)

### Step 1: Clone the Repository

```bash
cd /home/$USER
git clone <your-repo-url> voiceagent
cd voiceagent
```

### Step 2: Install Prerequisites

```bash
sudo bash scripts/setup-prerequisites.sh
```

This installs:
- Node.js 18
- Python 3.10
- Nginx
- PM2
- Certbot

**Time: ~5 minutes**

### Step 3: Configure API Keys

Edit `backend/.env` and add your API keys:

```bash
cd backend
cp .env.example .env
nano .env  # or vim, vi, etc.
```

Add your keys:
```env
GROQ_API_KEY=your_actual_groq_api_key
ELEVENLABS_API_KEY=your_actual_elevenlabs_api_key
```

Get API keys from:
- Groq: https://console.groq.com
- ElevenLabs: https://elevenlabs.io

### Step 4: Deploy Everything

```bash
cd /home/$USER/voiceagent
bash scripts/deploy-all.sh
```

Choose your deployment option:
- **1)** Development (for testing)
- **2)** Production with PM2 (simple)
- **3)** Production with systemd (enterprise)

**Time: ~3 minutes**

### Step 5: Access Your Platform

Open your browser:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

**You're done!** 🎉

---

## Option 2: Manual Setup

### Frontend Setup

```bash
cd voiceagent
bash scripts/setup-frontend.sh
cd frontend
npm start
```

### Backend Setup

```bash
cd voiceagent
bash scripts/setup-backend.sh
cd backend
source venv/bin/activate
python -m app.main
```

---

## Post-Installation

### Set up Nginx (Optional but Recommended)

```bash
sudo bash scripts/install-nginx.sh
```

This sets up a reverse proxy for better performance.

### Set up SSL (For Production)

```bash
sudo certbot --nginx -d yourdomain.com
```

Free SSL certificates from Let's Encrypt!

---

## Testing the Platform

1. **Navigate to Frontend**: http://localhost:3000
2. **Click "Try Live Demo"**
3. **Fill in Business Info**:
   - Business Name: "Test Plumbing Co"
   - Industry: "Plumber"
   - Goal: "Book Appointments"
4. **Upload a Sample Document** (optional)
5. **Click "Start Test Call"**

---

## Troubleshooting

### Services not starting?

```bash
# Check logs
sudo journalctl -u voiceai-backend -f
sudo journalctl -u voiceai-frontend -f

# Or with PM2
pm2 logs
```

### Port already in use?

```bash
# Find and kill process on port 3000
sudo lsof -i :3000
sudo kill -9 <PID>

# Same for port 8000
sudo lsof -i :8000
sudo kill -9 <PID>
```

### API keys not working?

1. Double-check your keys in `backend/.env`
2. Make sure there are no spaces or quotes
3. Restart the backend service

---

## Management Commands

### PM2 Deployment

```bash
# View status
pm2 list

# View logs
pm2 logs

# Restart
pm2 restart all

# Stop
pm2 stop all

# Auto-start on boot
pm2 startup
pm2 save
```

### Systemd Deployment

```bash
# Status
sudo systemctl status voiceai-backend voiceai-frontend

# Logs
sudo journalctl -u voiceai-backend -f

# Restart
sudo systemctl restart voiceai-backend voiceai-frontend

# Stop
sudo systemctl stop voiceai-backend voiceai-frontend
```

---

## What's Next?

1. **Customize the Frontend**: Edit `frontend/components/` to match your brand
2. **Add More Industries**: Update `frontend/components/DemoSandbox.tsx`
3. **Configure Voice Settings**: Edit `backend/.env` for TTS voice and VAD settings
4. **Set up Production Domain**: Update Nginx config and get SSL certificate
5. **Monitor Performance**: Set up logging and monitoring tools

---

## Getting Help

- **Documentation**: See `docs/LINUX_DEPLOYMENT.md` for detailed setup
- **Logs**: Check systemd or PM2 logs for errors
- **Issues**: Open an issue on GitHub

---

**Happy building!** 🚀

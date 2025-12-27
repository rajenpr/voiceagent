# Linux VM Deployment Guide

Complete guide for deploying the Voice AI SaaS platform on a Linux VM (Ubuntu 20.04/22.04 or similar).

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Prerequisites Installation](#prerequisites-installation)
3. [Frontend Setup (Next.js)](#frontend-setup)
4. [Backend Setup (FastAPI)](#backend-setup)
5. [Production Deployment](#production-deployment)
6. [Systemd Services](#systemd-services)
7. [Nginx Configuration](#nginx-configuration)
8. [SSL/TLS Setup](#ssltls-setup)
9. [Monitoring & Logs](#monitoring--logs)
10. [Troubleshooting](#troubleshooting)

---

## System Requirements

**Minimum Specs:**
- **CPU**: 2+ cores
- **RAM**: 4GB (8GB recommended)
- **Storage**: 20GB
- **OS**: Ubuntu 20.04/22.04, Debian 11+, or RHEL 8+

**Network:**
- Port 3000 (Frontend)
- Port 8000 (Backend API)
- Port 80 (HTTP)
- Port 443 (HTTPS)

---

## Prerequisites Installation

### Step 1: Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### Step 2: Install Node.js 18+

```bash
# Install Node.js 18.x LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or higher
```

### Step 3: Install Python 3.10+

```bash
# Ubuntu 22.04 has Python 3.10 by default
# For Ubuntu 20.04, add deadsnakes PPA:
sudo apt install -y software-properties-common
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update

# Install Python 3.10 and pip
sudo apt install -y python3.10 python3.10-venv python3.10-dev python3-pip

# Verify installation
python3.10 --version  # Should show Python 3.10.x
```

### Step 4: Install System Dependencies

```bash
# Build tools and libraries
sudo apt install -y build-essential git curl wget unzip

# For PDF processing
sudo apt install -y libpoppler-cpp-dev

# For PyTorch (if using CPU)
# No additional packages needed

# For Nginx (reverse proxy)
sudo apt install -y nginx
```

### Step 5: Install PM2 (Process Manager)

```bash
# PM2 for Node.js process management
sudo npm install -g pm2

# Verify installation
pm2 --version
```

---

## Frontend Setup

### Step 1: Clone Repository (if not already done)

```bash
cd /home/$USER
git clone <your-repo-url> voiceagent
cd voiceagent/frontend
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment (Optional)

Create `.env.local` for frontend environment variables:

```bash
cat > .env.local << 'EOF'
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000

# Production URLs (update with your domain)
# NEXT_PUBLIC_API_URL=https://api.yourdomain.com
# NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com
EOF
```

### Step 4: Build for Production

```bash
npm run build
```

### Step 5: Test Frontend

```bash
# Start in production mode
npm start

# Or use PM2 (recommended)
pm2 start npm --name "voiceai-frontend" -- start
pm2 save
```

Frontend should now be running on `http://localhost:3000`

---

## Backend Setup

### Step 1: Navigate to Backend Directory

```bash
cd /home/$USER/voiceagent/backend
```

### Step 2: Create Virtual Environment

```bash
python3.10 -m venv venv
source venv/bin/activate
```

### Step 3: Install Python Dependencies

```bash
# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt
```

**Note**: This may take 5-10 minutes depending on your connection.

### Step 4: Configure Environment Variables

```bash
cp .env.example .env
nano .env  # Or use vim, vi, etc.
```

**Required API Keys** (add to `.env`):

```env
# API Keys - REQUIRED
GROQ_API_KEY=your_actual_groq_api_key_here
ELEVENLABS_API_KEY=your_actual_elevenlabs_api_key_here

# Optional
OPENAI_API_KEY=your_openai_key_here
DAILY_API_KEY=your_daily_key_here

# Server Configuration
PORT=8000
HOST=0.0.0.0
DEBUG=False  # Set to False in production

# CORS - Update with your domain
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com

# Storage
CHROMA_PERSIST_DIRECTORY=./data/chroma
UPLOAD_DIRECTORY=./data/uploads

# Voice Settings
TTS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
VAD_THRESHOLD=0.5
```

### Step 5: Create Data Directories

```bash
mkdir -p data/uploads data/chroma
chmod 755 data data/uploads data/chroma
```

### Step 6: Test Backend

```bash
# Make sure virtual environment is activated
source venv/bin/activate

# Run the server
python -m app.main
```

Backend should now be running on `http://localhost:8000`

Test with: `curl http://localhost:8000/`

---

## Production Deployment

### Option 1: Using PM2 for Both Services

**Frontend:**

```bash
cd /home/$USER/voiceagent/frontend
pm2 start npm --name "voiceai-frontend" -- start
```

**Backend:**

Create a PM2 ecosystem file:

```bash
cd /home/$USER/voiceagent/backend
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'voiceai-backend',
    script: 'venv/bin/python',
    args: '-m app.main',
    cwd: '/home/' + process.env.USER + '/voiceagent/backend',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
EOF

pm2 start ecosystem.config.js
```

**Manage PM2 processes:**

```bash
# View all processes
pm2 list

# View logs
pm2 logs voiceai-backend
pm2 logs voiceai-frontend

# Restart
pm2 restart voiceai-backend
pm2 restart voiceai-frontend

# Stop
pm2 stop voiceai-backend
pm2 stop voiceai-frontend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions printed by the command
```

### Option 2: Using Systemd Services (Recommended for Production)

See the [Systemd Services](#systemd-services) section below.

---

## Systemd Services

Systemd is more reliable for production deployments.

### Backend Service

Create service file:

```bash
sudo nano /etc/systemd/system/voiceai-backend.service
```

Add the following content (replace `YOUR_USERNAME` with your actual username):

```ini
[Unit]
Description=Voice AI Backend API
After=network.target

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/home/YOUR_USERNAME/voiceagent/backend
Environment="PATH=/home/YOUR_USERNAME/voiceagent/backend/venv/bin"
ExecStart=/home/YOUR_USERNAME/voiceagent/backend/venv/bin/python -m app.main
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Frontend Service

```bash
sudo nano /etc/systemd/system/voiceai-frontend.service
```

Add the following content:

```ini
[Unit]
Description=Voice AI Frontend
After=network.target

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/home/YOUR_USERNAME/voiceagent/frontend
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

### Enable and Start Services

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable services (start on boot)
sudo systemctl enable voiceai-backend
sudo systemctl enable voiceai-frontend

# Start services
sudo systemctl start voiceai-backend
sudo systemctl start voiceai-frontend

# Check status
sudo systemctl status voiceai-backend
sudo systemctl status voiceai-frontend

# View logs
sudo journalctl -u voiceai-backend -f
sudo journalctl -u voiceai-frontend -f
```

### Service Management Commands

```bash
# Restart
sudo systemctl restart voiceai-backend
sudo systemctl restart voiceai-frontend

# Stop
sudo systemctl stop voiceai-backend
sudo systemctl stop voiceai-frontend

# Check logs (last 50 lines)
sudo journalctl -u voiceai-backend -n 50 --no-pager
sudo journalctl -u voiceai-frontend -n 50 --no-pager
```

---

## Nginx Configuration

Use Nginx as a reverse proxy for better performance and SSL termination.

### Step 1: Install Nginx (if not already installed)

```bash
sudo apt install -y nginx
```

### Step 2: Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/voiceai
```

Add the following configuration:

```nginx
# HTTP Configuration
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;  # Replace with your domain

    # Redirect HTTP to HTTPS (after SSL setup)
    # return 301 https://$server_name$request_uri;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
    }

    # WebSocket endpoint for voice
    location /ws/ {
        proxy_pass http://localhost:8000/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket timeout
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    # File upload size limit
    client_max_body_size 100M;
}
```

### Step 3: Enable the Configuration

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/voiceai /etc/nginx/sites-enabled/

# Remove default configuration
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Step 4: Configure Firewall

```bash
# Allow Nginx through firewall
sudo ufw allow 'Nginx Full'

# Or manually open ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp  # If accessing frontend directly
sudo ufw allow 8000/tcp  # If accessing backend directly

# Enable firewall (if not already enabled)
sudo ufw enable
sudo ufw status
```

---

## SSL/TLS Setup

Use Let's Encrypt for free SSL certificates.

### Step 1: Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Step 2: Obtain SSL Certificate

```bash
# Replace with your actual domain and email
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts:
- Enter your email
- Agree to Terms of Service
- Choose whether to redirect HTTP to HTTPS (recommended: Yes)

### Step 3: Verify Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot auto-renewal is enabled by default via systemd timer
sudo systemctl status certbot.timer
```

### Step 4: Update CORS in Backend

Update `backend/.env`:

```env
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

Restart backend:

```bash
sudo systemctl restart voiceai-backend
```

---

## Monitoring & Logs

### View Application Logs

**Using systemd:**

```bash
# Backend logs (real-time)
sudo journalctl -u voiceai-backend -f

# Frontend logs (real-time)
sudo journalctl -u voiceai-frontend -f

# Last 100 lines
sudo journalctl -u voiceai-backend -n 100
```

**Using PM2:**

```bash
pm2 logs voiceai-backend
pm2 logs voiceai-frontend
pm2 monit  # Real-time monitoring
```

### Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### System Resource Monitoring

```bash
# CPU and Memory usage
htop

# Or use top
top

# Disk usage
df -h

# Check specific process
ps aux | grep python
ps aux | grep node
```

---

## Troubleshooting

### Issue: Frontend not building

```bash
# Clear cache and reinstall
cd /home/$USER/voiceagent/frontend
rm -rf node_modules .next
npm install
npm run build
```

### Issue: Backend dependencies failing

```bash
# Update pip and setuptools
pip install --upgrade pip setuptools wheel

# Install dependencies one by one to find the issue
pip install fastapi uvicorn pydantic
# ... continue with others
```

### Issue: Port already in use

```bash
# Find process using port 3000
sudo lsof -i :3000
# Kill the process
sudo kill -9 <PID>

# Find process using port 8000
sudo lsof -i :8000
sudo kill -9 <PID>
```

### Issue: Permission denied

```bash
# Fix ownership of voiceagent directory
sudo chown -R $USER:$USER /home/$USER/voiceagent

# Fix permissions
chmod -R 755 /home/$USER/voiceagent
```

### Issue: Nginx configuration error

```bash
# Test configuration
sudo nginx -t

# Check syntax
sudo nginx -c /etc/nginx/nginx.conf -t

# Restart Nginx
sudo systemctl restart nginx
```

### Issue: WebSocket connection failing

Check CORS settings in `backend/.env`:

```env
CORS_ORIGINS=http://yourdomain.com,https://yourdomain.com
```

Check Nginx WebSocket configuration is correct (see above).

### Issue: Services not starting on boot

```bash
# Re-enable services
sudo systemctl enable voiceai-backend
sudo systemctl enable voiceai-frontend
sudo systemctl enable nginx

# Check status
sudo systemctl is-enabled voiceai-backend
```

---

## Quick Reference Commands

### Service Management

```bash
# Start all services
sudo systemctl start voiceai-backend voiceai-frontend nginx

# Stop all services
sudo systemctl stop voiceai-backend voiceai-frontend

# Restart all services
sudo systemctl restart voiceai-backend voiceai-frontend nginx

# Check status
sudo systemctl status voiceai-backend voiceai-frontend nginx
```

### Logs

```bash
# View all logs
sudo journalctl -u voiceai-backend -u voiceai-frontend -f
```

### Updates

```bash
# Pull latest code
cd /home/$USER/voiceagent
git pull

# Update frontend
cd frontend
npm install
npm run build
sudo systemctl restart voiceai-frontend

# Update backend
cd ../backend
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart voiceai-backend
```

---

## Performance Tuning

### Increase File Upload Limits

Edit `backend/.env`:

```env
MAX_UPLOAD_SIZE=104857600  # 100MB in bytes
```

### PM2 Cluster Mode (for frontend)

```bash
pm2 start npm --name "voiceai-frontend" -i max -- start
```

### Uvicorn Workers (for backend)

Update systemd service:

```ini
ExecStart=/home/YOUR_USERNAME/voiceagent/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## Security Checklist

- ✅ Enable firewall (ufw)
- ✅ Install SSL certificates
- ✅ Set `DEBUG=False` in production
- ✅ Restrict CORS to your domain only
- ✅ Use strong passwords for API keys
- ✅ Keep system updated (`sudo apt update && sudo apt upgrade`)
- ✅ Use environment variables for secrets
- ✅ Regular backups of data directory

---

## Support

For issues, check:
1. Application logs (journalctl)
2. Nginx logs (/var/log/nginx/)
3. System resources (htop, df -h)
4. Network connectivity (curl, ping)

---

**You're all set!** 🎉

Your Voice AI platform should now be running on your Linux VM at:
- Frontend: `http://your-server-ip:3000` or `https://yourdomain.com`
- Backend API: `http://your-server-ip:8000` or `https://yourdomain.com/api`

#!/bin/bash

################################################################################
# Voice AI SaaS - Complete Deployment Script
#
# This script performs a complete deployment of the Voice AI platform
# Run from project root: bash scripts/deploy-all.sh
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════╗"
echo "║                                                ║"
echo "║      Voice AI SaaS - Full Deployment          ║"
echo "║                                                ║"
echo "╚════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Check if running from correct directory
if [ ! -f "README.md" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo -e "${RED}Error: Must run from project root directory${NC}"
    echo "Current directory: $(pwd)"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"
echo ""

MISSING_DEPS=0

if ! command_exists node; then
    echo -e "${RED}✗ Node.js not found${NC}"
    MISSING_DEPS=1
else
    echo -e "${GREEN}✓ Node.js $(node --version)${NC}"
fi

if ! command_exists npm; then
    echo -e "${RED}✗ npm not found${NC}"
    MISSING_DEPS=1
else
    echo -e "${GREEN}✓ npm $(npm --version)${NC}"
fi

if ! command_exists python3.10; then
    echo -e "${RED}✗ Python 3.10 not found${NC}"
    MISSING_DEPS=1
else
    echo -e "${GREEN}✓ Python $(python3.10 --version)${NC}"
fi

if [ $MISSING_DEPS -eq 1 ]; then
    echo ""
    echo -e "${RED}Missing prerequisites!${NC}"
    echo "Run: sudo bash scripts/setup-prerequisites.sh"
    exit 1
fi

echo ""

# Ask for deployment type
echo -e "${YELLOW}Select deployment type:${NC}"
echo "1) Development (both services with logs)"
echo "2) Production with PM2"
echo "3) Production with systemd"
read -p "Enter choice [1-3]: " DEPLOY_TYPE

echo ""

# Setup frontend
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}Setting up Frontend...${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
bash scripts/setup-frontend.sh

echo ""

# Setup backend
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}Setting up Backend...${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
bash scripts/setup-backend.sh

echo ""

# Check if .env is configured
if ! grep -q "your_groq_api_key_here" backend/.env 2>/dev/null; then
    echo -e "${GREEN}✓ Backend .env appears to be configured${NC}"
else
    echo -e "${YELLOW}⚠ Backend .env needs configuration${NC}"
    echo -e "${RED}Please edit backend/.env with your API keys before starting services${NC}"
    read -p "Press Enter to continue or Ctrl+C to exit..."
fi

echo ""

# Deploy based on type
case $DEPLOY_TYPE in
    1)
        echo -e "${GREEN}════════════════════════════════════════${NC}"
        echo -e "${GREEN}Starting Development Servers...${NC}"
        echo -e "${GREEN}════════════════════════════════════════${NC}"
        echo ""
        echo "Starting backend in background..."
        cd backend
        source venv/bin/activate
        python -m app.main &
        BACKEND_PID=$!
        cd ..

        echo "Starting frontend in background..."
        cd frontend
        npm run dev &
        FRONTEND_PID=$!
        cd ..

        echo ""
        echo -e "${GREEN}Services started!${NC}"
        echo "Backend PID: $BACKEND_PID"
        echo "Frontend PID: $FRONTEND_PID"
        echo ""
        echo "Frontend: http://localhost:3000"
        echo "Backend:  http://localhost:8000"
        echo ""
        echo "Press Ctrl+C to stop both services"

        # Wait for interrupt
        trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
        wait
        ;;

    2)
        echo -e "${GREEN}════════════════════════════════════════${NC}"
        echo -e "${GREEN}Deploying with PM2...${NC}"
        echo -e "${GREEN}════════════════════════════════════════${NC}"

        if ! command_exists pm2; then
            echo -e "${RED}PM2 not found!${NC}"
            echo "Install with: sudo npm install -g pm2"
            exit 1
        fi

        echo ""
        echo "Starting backend with PM2..."
        cd backend
        cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'voiceai-backend',
    script: 'venv/bin/python',
    args: '-m app.main',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
}
EOF
        pm2 start ecosystem.config.js
        cd ..

        echo "Starting frontend with PM2..."
        cd frontend
        pm2 start npm --name "voiceai-frontend" -- start
        cd ..

        pm2 save

        echo ""
        echo -e "${GREEN}Services started with PM2!${NC}"
        echo ""
        echo "View status: pm2 list"
        echo "View logs:   pm2 logs"
        echo "Restart:     pm2 restart all"
        echo "Stop:        pm2 stop all"
        echo ""
        ;;

    3)
        echo -e "${GREEN}════════════════════════════════════════${NC}"
        echo -e "${GREEN}Deploying with systemd...${NC}"
        echo -e "${GREEN}════════════════════════════════════════${NC}"
        echo ""
        echo "This requires root privileges"
        sudo bash scripts/install-services.sh

        echo ""
        echo "Starting services..."
        sudo systemctl start voiceai-backend
        sudo systemctl start voiceai-frontend

        echo ""
        echo -e "${GREEN}Services started with systemd!${NC}"
        echo ""
        echo "Check status: sudo systemctl status voiceai-backend voiceai-frontend"
        echo "View logs:    sudo journalctl -u voiceai-backend -f"
        echo "Restart:      sudo systemctl restart voiceai-backend"
        echo ""
        ;;

    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                ║${NC}"
echo -e "${BLUE}║         🎉  Deployment Complete! 🎉           ║${NC}"
echo -e "${BLUE}║                                                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Your Voice AI platform is now running!${NC}"
echo ""
echo "Access points:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Set up Nginx reverse proxy: sudo bash scripts/install-nginx.sh"
echo "2. Configure SSL with Certbot: sudo certbot --nginx"
echo "3. Test the interactive demo at http://localhost:3000"
echo ""

#!/bin/bash

################################################################################
# Voice AI SaaS - Quick WebSocket Fix
#
# This script fixes the WebSocket connection issue by updating frontend
# configuration to use the public IP address instead of localhost
#
# Run from project root: bash scripts/quick-fix-websocket.sh
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
echo "║      Voice AI - WebSocket Connection Fix      ║"
echo "║                                                ║"
echo "╚════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Get server IP (you can replace this with your actual IP)
read -p "Enter your server's public IP address (default: 72.62.162.248): " SERVER_IP
SERVER_IP=${SERVER_IP:-72.62.162.248}

echo ""
echo -e "${GREEN}[1/4] Updating frontend .env.local...${NC}"
cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=http://${SERVER_IP}:8000
NEXT_PUBLIC_WS_URL=ws://${SERVER_IP}:8000
EOF
echo "✓ Created frontend/.env.local"

echo ""
echo -e "${GREEN}[2/4] Updating backend CORS settings...${NC}"
# Update CORS_ORIGINS in backend/.env
if [ -f "backend/.env" ]; then
    # Check if CORS_ORIGINS exists
    if grep -q "CORS_ORIGINS=" backend/.env; then
        # Replace existing line
        sed -i "s|CORS_ORIGINS=.*|CORS_ORIGINS=http://${SERVER_IP}:3000,http://${SERVER_IP},http://localhost:3000,http://localhost:8000|" backend/.env
    else
        # Add new line
        echo "CORS_ORIGINS=http://${SERVER_IP}:3000,http://${SERVER_IP},http://localhost:3000,http://localhost:8000" >> backend/.env
    fi
    echo "✓ Updated backend/.env CORS settings"
else
    echo -e "${RED}Warning: backend/.env not found${NC}"
fi

echo ""
echo -e "${GREEN}[3/4] Rebuilding frontend...${NC}"
cd frontend
npm run build
cd ..
echo "✓ Frontend rebuilt successfully"

echo ""
echo -e "${GREEN}[4/4] Configuration complete!${NC}"

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                ║${NC}"
echo -e "${BLUE}║         🎉  Fix Complete! 🎉                  ║${NC}"
echo -e "${BLUE}║                                                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "1. Restart your services:"
echo ""
echo -e "${YELLOW}   For systemd:${NC}"
echo "   sudo systemctl restart voiceai-backend voiceai-frontend"
echo ""
echo -e "${YELLOW}   For PM2:${NC}"
echo "   pm2 restart all"
echo ""
echo -e "${YELLOW}   For development:${NC}"
echo "   # Kill current processes and restart manually"
echo ""
echo "2. Test at: http://${SERVER_IP}:3000"
echo "3. Check browser console (F12) for WebSocket connection status"
echo ""

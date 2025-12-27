#!/bin/bash

################################################################################
# Voice AI SaaS - Install Systemd Services
#
# This script installs and enables systemd services for the Voice AI platform
# Run with: sudo bash scripts/install-services.sh
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root (use sudo)${NC}"
   exit 1
fi

# Get the actual user
ACTUAL_USER=${SUDO_USER:-$USER}
USER_HOME=$(eval echo ~$ACTUAL_USER)

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Installing Systemd Services${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "User: $ACTUAL_USER"
echo "Home: $USER_HOME"
echo ""

# Check if voiceagent directory exists
if [ ! -d "$USER_HOME/voiceagent" ]; then
    echo -e "${RED}Error: $USER_HOME/voiceagent directory not found${NC}"
    echo "Please clone the repository first"
    exit 1
fi

# Backend service
echo -e "${GREEN}[1/4] Installing backend service...${NC}"
sed "s/YOUR_USERNAME/$ACTUAL_USER/g" "$USER_HOME/voiceagent/deployment/systemd/voiceai-backend.service" \
    > /etc/systemd/system/voiceai-backend.service

# Frontend service
echo -e "${GREEN}[2/4] Installing frontend service...${NC}"
sed "s/YOUR_USERNAME/$ACTUAL_USER/g" "$USER_HOME/voiceagent/deployment/systemd/voiceai-frontend.service" \
    > /etc/systemd/system/voiceai-frontend.service

# Reload systemd
echo -e "${GREEN}[3/4] Reloading systemd daemon...${NC}"
systemctl daemon-reload

# Enable services
echo -e "${GREEN}[4/4] Enabling services...${NC}"
systemctl enable voiceai-backend
systemctl enable voiceai-frontend

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Services Installed Successfully!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Service files created:"
echo "  - /etc/systemd/system/voiceai-backend.service"
echo "  - /etc/systemd/system/voiceai-frontend.service"
echo ""
echo -e "${YELLOW}To start the services:${NC}"
echo "  sudo systemctl start voiceai-backend"
echo "  sudo systemctl start voiceai-frontend"
echo ""
echo -e "${YELLOW}To check status:${NC}"
echo "  sudo systemctl status voiceai-backend"
echo "  sudo systemctl status voiceai-frontend"
echo ""
echo -e "${YELLOW}To view logs:${NC}"
echo "  sudo journalctl -u voiceai-backend -f"
echo "  sudo journalctl -u voiceai-frontend -f"
echo ""

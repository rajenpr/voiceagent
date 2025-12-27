#!/bin/bash

################################################################################
# Voice AI SaaS - System Prerequisites Installation Script
#
# This script installs all required system dependencies for Ubuntu 20.04/22.04
# Run with: sudo bash setup-prerequisites.sh
################################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root (use sudo)${NC}"
   exit 1
fi

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Voice AI Prerequisites Setup${NC}"
echo -e "${GREEN}================================${NC}"
echo ""

# Get the actual user (not root)
ACTUAL_USER=${SUDO_USER:-$USER}
echo -e "${YELLOW}Installing for user: $ACTUAL_USER${NC}"
echo ""

# Update system
echo -e "${GREEN}[1/7] Updating system packages...${NC}"
apt update && apt upgrade -y

# Install basic tools
echo -e "${GREEN}[2/7] Installing basic development tools...${NC}"
apt install -y \
    build-essential \
    git \
    curl \
    wget \
    unzip \
    software-properties-common \
    libpoppler-cpp-dev \
    ca-certificates \
    gnupg

# Install Node.js 18
echo -e "${GREEN}[3/7] Installing Node.js 18...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
else
    echo "Node.js already installed: $(node --version)"
fi

# Install Python 3.10
echo -e "${GREEN}[4/7] Installing Python 3.10...${NC}"
if ! command -v python3.10 &> /dev/null; then
    add-apt-repository ppa:deadsnakes/ppa -y
    apt update
    apt install -y python3.10 python3.10-venv python3.10-dev python3-pip
else
    echo "Python 3.10 already installed: $(python3.10 --version)"
fi

# Install Nginx
echo -e "${GREEN}[5/7] Installing Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
else
    echo "Nginx already installed: $(nginx -v 2>&1)"
fi

# Install PM2
echo -e "${GREEN}[6/7] Installing PM2 process manager...${NC}"
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
else
    echo "PM2 already installed: $(pm2 --version)"
fi

# Install Certbot (for SSL)
echo -e "${GREEN}[7/7] Installing Certbot for SSL...${NC}"
if ! command -v certbot &> /dev/null; then
    apt install -y certbot python3-certbot-nginx
else
    echo "Certbot already installed: $(certbot --version)"
fi

# Configure firewall
echo -e "${GREEN}Configuring UFW firewall...${NC}"
if command -v ufw &> /dev/null; then
    ufw --force enable
    ufw allow ssh
    ufw allow 'Nginx Full'
    ufw allow 3000/tcp comment 'Next.js Frontend'
    ufw allow 8000/tcp comment 'FastAPI Backend'
    echo "Firewall configured"
else
    echo "UFW not found, skipping firewall configuration"
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Installation Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Installed versions:"
echo "  - Node.js: $(node --version)"
echo "  - npm: $(npm --version)"
echo "  - Python: $(python3.10 --version)"
echo "  - Nginx: $(nginx -v 2>&1 | cut -d'/' -f2)"
echo "  - PM2: $(pm2 --version)"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Clone the Voice AI repository"
echo "2. Set up the frontend (see docs/LINUX_DEPLOYMENT.md)"
echo "3. Set up the backend (see docs/LINUX_DEPLOYMENT.md)"
echo "4. Configure systemd services or use PM2"
echo "5. Set up Nginx reverse proxy"
echo ""
echo -e "${GREEN}Done!${NC}"

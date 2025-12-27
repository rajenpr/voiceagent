#!/bin/bash

################################################################################
# Voice AI SaaS - Install Nginx Configuration
#
# This script installs the Nginx reverse proxy configuration
# Run with: sudo bash scripts/install-nginx.sh
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
echo -e "${GREEN}Installing Nginx Configuration${NC}"
echo -e "${GREEN}================================${NC}"
echo ""

# Check if Nginx is installed
if ! command -v nginx &> /dev/null; then
    echo -e "${RED}Error: Nginx is not installed${NC}"
    echo "Run: sudo apt install nginx"
    exit 1
fi

# Prompt for domain name
read -p "Enter your domain name (or press Enter for localhost): " DOMAIN
if [ -z "$DOMAIN" ]; then
    DOMAIN="localhost"
fi

echo ""
echo "Using domain: $DOMAIN"
echo ""

# Copy and configure Nginx file
echo -e "${GREEN}[1/4] Installing Nginx configuration...${NC}"
sed "s/yourdomain.com/$DOMAIN/g" "$USER_HOME/voiceagent/deployment/nginx/voiceai.conf" \
    > /etc/nginx/sites-available/voiceai

# Enable the site
echo -e "${GREEN}[2/4] Enabling site...${NC}"
ln -sf /etc/nginx/sites-available/voiceai /etc/nginx/sites-enabled/

# Remove default site
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    echo -e "${GREEN}[3/4] Removing default site...${NC}"
    rm /etc/nginx/sites-enabled/default
fi

# Test configuration
echo -e "${GREEN}[4/4] Testing Nginx configuration...${NC}"
nginx -t

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Nginx Configuration Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Configuration file: /etc/nginx/sites-available/voiceai"
echo "Domain: $DOMAIN"
echo ""
echo -e "${YELLOW}To reload Nginx:${NC}"
echo "  sudo systemctl reload nginx"
echo ""

if [ "$DOMAIN" != "localhost" ]; then
    echo -e "${YELLOW}To set up SSL with Let's Encrypt:${NC}"
    echo "  sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
    echo ""
fi

# Ask to reload
read -p "Reload Nginx now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    systemctl reload nginx
    echo -e "${GREEN}Nginx reloaded successfully!${NC}"
fi

echo ""
echo "Your site should be accessible at:"
if [ "$DOMAIN" = "localhost" ]; then
    echo "  http://localhost"
else
    echo "  http://$DOMAIN"
fi
echo ""

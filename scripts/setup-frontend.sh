#!/bin/bash

################################################################################
# Voice AI SaaS - Frontend Setup Script
#
# This script sets up the Next.js frontend
# Run from the project root: bash scripts/setup-frontend.sh
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Voice AI Frontend Setup${NC}"
echo -e "${GREEN}================================${NC}"
echo ""

# Check if in correct directory
if [ ! -f "frontend/package.json" ]; then
    echo -e "${RED}Error: Must run from project root directory${NC}"
    echo "Current directory: $(pwd)"
    exit 1
fi

# Navigate to frontend
cd frontend

# Install dependencies
echo -e "${GREEN}[1/3] Installing npm dependencies...${NC}"
npm install

# Create environment file if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo -e "${GREEN}[2/3] Creating .env.local file...${NC}"
    cat > .env.local << 'EOF'
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000

# Production URLs (uncomment and update with your domain)
# NEXT_PUBLIC_API_URL=https://api.yourdomain.com
# NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com
EOF
    echo "Created .env.local - please update with your configuration"
else
    echo ".env.local already exists, skipping..."
fi

# Build the application
echo -e "${GREEN}[3/3] Building Next.js application...${NC}"
npm run build

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Frontend Setup Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${YELLOW}To start the frontend:${NC}"
echo "  Development: cd frontend && npm run dev"
echo "  Production:  cd frontend && npm start"
echo "  PM2:         pm2 start npm --name voiceai-frontend -- start"
echo ""
echo "The frontend will be available at http://localhost:3000"
echo ""

#!/bin/bash

################################################################################
# Voice AI SaaS - Backend Setup Script
#
# This script sets up the FastAPI backend with Python virtual environment
# Run from the project root: bash scripts/setup-backend.sh
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Voice AI Backend Setup${NC}"
echo -e "${GREEN}================================${NC}"
echo ""

# Check if in correct directory
if [ ! -f "backend/requirements.txt" ]; then
    echo -e "${RED}Error: Must run from project root directory${NC}"
    echo "Current directory: $(pwd)"
    exit 1
fi

# Navigate to backend
cd backend

# Create virtual environment
echo -e "${GREEN}[1/5] Creating Python virtual environment...${NC}"
if [ -d "venv" ]; then
    echo "Virtual environment already exists, removing..."
    rm -rf venv
fi
python3.10 -m venv venv

# Activate virtual environment
echo -e "${GREEN}[2/5] Activating virtual environment...${NC}"
source venv/bin/activate

# Upgrade pip
echo -e "${GREEN}[3/5] Upgrading pip...${NC}"
pip install --upgrade pip setuptools wheel

# Install dependencies
echo -e "${GREEN}[4/5] Installing Python dependencies...${NC}"
echo "This may take 5-10 minutes..."
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${GREEN}[5/5] Creating .env file...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}IMPORTANT: Please update backend/.env with your API keys!${NC}"
    echo ""
    echo "Required API keys:"
    echo "  - GROQ_API_KEY (get from https://console.groq.com)"
    echo "  - ELEVENLABS_API_KEY (get from https://elevenlabs.io)"
    echo "  - DAILY_API_KEY (optional, get from https://daily.co)"
    echo ""
else
    echo ".env already exists, skipping..."
fi

# Create data directories
echo -e "${GREEN}Creating data directories...${NC}"
mkdir -p data/uploads data/chroma
chmod 755 data data/uploads data/chroma

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Backend Setup Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Edit backend/.env and add your API keys"
echo "2. Activate the virtual environment: source backend/venv/bin/activate"
echo "3. Start the server: python -m app.main"
echo ""
echo "The backend will be available at http://localhost:8000"
echo ""

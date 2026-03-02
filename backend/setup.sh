#!/bin/bash
# Evaide Backend Setup Script for Mac
# Run this to install everything needed

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}======================================"
echo -e "  Evaide Backend Setup (Mac)"
echo -e "======================================${NC}"
echo ""

# Check Python
echo -e "${YELLOW}[1/4] Checking Python...${NC}"
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}  Found: $PYTHON_VERSION${NC}"
else
    echo -e "${RED}  ERROR: Python not found!${NC}"
    echo -e "${YELLOW}  Install from: https://python.org${NC}"
    exit 1
fi

# Check Homebrew
echo ""
echo -e "${YELLOW}[2/4] Checking ODBC Driver...${NC}"
if ! command -v brew &> /dev/null; then
    echo -e "${RED}  ERROR: Homebrew not found!${NC}"
    echo -e "${YELLOW}  Install Homebrew first: https://brew.sh${NC}"
    exit 1
fi

# Check/Install ODBC Driver
if brew list msodbcsql18 &> /dev/null 2>&1 || brew list msodbcsql17 &> /dev/null 2>&1; then
    echo -e "${GREEN}  ODBC Driver already installed${NC}"
else
    echo -e "${YELLOW}  Installing ODBC Driver 18...${NC}"
    brew tap microsoft/mssql-release https://github.com/Microsoft/homebrew-mssql-release
    brew update
    HOMEBREW_NO_ENV_FILTERING=1 ACCEPT_EULA=Y brew install msodbcsql18
    echo -e "${GREEN}  ODBC Driver installed!${NC}"
fi

# Create virtual environment
echo ""
echo -e "${YELLOW}[3/4] Setting up virtual environment...${NC}"
if [ -d "venv" ]; then
    echo -e "${YELLOW}  venv already exists${NC}"
else
    python3 -m venv venv
    echo -e "${GREEN}  Created venv${NC}"
fi

# Install packages
echo ""
echo -e "${YELLOW}[4/4] Installing Python packages...${NC}"
source venv/bin/activate
pip3 install -r requirements.txt --quiet --upgrade
echo -e "${GREEN}  All packages installed!${NC}"

# Done
echo ""
echo -e "${GREEN}======================================"
echo -e "  Setup Complete!"
echo -e "======================================${NC}"
echo ""
echo -e "${CYAN}To start the server:${NC}"
echo -e "  1. Make sure you have the .env file"
echo -e "  2. Run: uvicorn main:app --reload"
echo ""
echo -e "${CYAN}Then open: http://127.0.0.1:8000/docs${NC}"

deactivate
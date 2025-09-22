#!/bin/bash

# Enhanced Docker startup script with robust JWT token handling
# This script manually parses the .env file to handle complex JWT tokens

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐳 MrRoboto Docker Startup Script (Enhanced)${NC}"
echo "================================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Check if .env file exists (or backup)
ENV_FILE=".env"
if [ ! -f ".env" ] && [ -f ".env.backup-original" ]; then
    ENV_FILE=".env.backup-original"
    echo -e "${YELLOW}⚠️  Using backup .env file: .env.backup-original${NC}"
elif [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found. Please copy .env_example to .env and configure it.${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Loading environment variables from .env file...${NC}"

# Function to safely export environment variables from .env
load_env_vars() {
    while IFS= read -r line || [[ -n "$line" ]]; do
        # Skip empty lines and comments
        if [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]]; then
            continue
        fi
        
        # Extract key=value pairs
        if [[ "$line" =~ ^([^=]+)=(.*)$ ]]; then
            key="${BASH_REMATCH[1]}"
            value="${BASH_REMATCH[2]}"
            
            # Remove surrounding quotes if present
            value="${value#\"}"
            value="${value%\"}"
            value="${value#\'}"
            value="${value%\'}"
            
            # Export the variable
            export "$key"="$value"
            echo -e "${GREEN}✓${NC} Loaded: $key"
        fi
            done < "$ENV_FILE"
}

# Load environment variables
load_env_vars

echo -e "${GREEN}✅ Environment variables loaded successfully${NC}"

# Check if containers are already running
if [ "$(docker-compose ps -q)" ]; then
    echo -e "${YELLOW}⚠️  Containers are already running${NC}"
    echo -e "${BLUE}📊 Current status:${NC}"
    docker-compose ps
    
    read -p "Do you want to restart the containers? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🔄 Stopping containers...${NC}"
        docker-compose down
    else
        echo -e "${GREEN}✅ Keeping existing containers running${NC}"
        exit 0
    fi
fi

# Build and start containers using environment variables
echo -e "${BLUE}🔨 Building and starting containers...${NC}"
docker-compose up -d --build

# Wait for containers to be ready
echo -e "${BLUE}⏳ Waiting for containers to be ready...${NC}"
sleep 5

# Check container status
echo -e "${BLUE}📊 Container Status:${NC}"
docker-compose ps

# Show logs
echo -e "${BLUE}📋 Recent logs:${NC}"
docker-compose logs --tail=20

# Health check
echo -e "${BLUE}🏥 Health check:${NC}"
if docker-compose exec -T mrroboto-bot node -e "console.log('✅ Container is healthy')" 2>/dev/null; then
    echo -e "${GREEN}✅ Container is responding${NC}"
else
    echo -e "${YELLOW}⚠️  Container may still be starting up${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Docker setup complete!${NC}"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo "  View logs:     docker-compose logs -f"
echo "  Stop:          docker-compose down"
echo "  Restart:       docker-compose restart"
echo "  Shell access:  docker-compose exec mrroboto-bot sh"
echo ""
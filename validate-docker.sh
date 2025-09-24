#!/bin/bash

# Docker Setup Validation Script
# Run this to verify your Docker setup is ready

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${GREEN}✅${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠️${NC} $1"; }
print_error() { echo -e "${RED}❌${NC} $1"; }
print_info() { echo -e "${BLUE}ℹ️${NC} $1"; }

echo -e "${BLUE}🐳 MrRobotoV3 Docker Setup Validation${NC}"
echo "=========================================="
echo

# Check 1: Docker installed
print_info "Checking Docker installation..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
    print_status "Docker is installed (version: $DOCKER_VERSION)"
else
    print_error "Docker is not installed"
    echo "   Please install Docker from: https://www.docker.com/get-started"
    exit 1
fi

# Check 2: Docker daemon running
print_info "Checking Docker daemon..."
if docker info &> /dev/null; then
    print_status "Docker daemon is running"
else
    print_error "Docker daemon is not running"
    echo "   Please start Docker and try again"
    exit 1
fi

# Check 3: Docker Compose
print_info "Checking Docker Compose..."
if docker-compose --version &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1)
    print_status "Docker Compose is available (version: $COMPOSE_VERSION)"
elif docker compose version &> /dev/null; then
    COMPOSE_VERSION=$(docker compose version --short)
    print_status "Docker Compose is available (version: $COMPOSE_VERSION)"
    print_info "Note: Use 'docker compose' instead of 'docker-compose' for commands"
else
    print_error "Docker Compose is not available"
    echo "   Please install Docker Desktop or Docker Compose plugin"
    exit 1
fi

# Check 4: Required files
print_info "Checking required files..."

required_files=("Dockerfile" "docker-compose.yml" ".dockerignore")
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        print_status "$file exists"
    else
        print_error "$file is missing"
        exit 1
    fi
done

# Check 5: Environment file
print_info "Checking environment configuration..."
if [ -f ".env" ]; then
    print_status ".env file exists"
    
    # Check for required variables
    required_vars=("BOT_USER_TOKEN" "COMETCHAT_AUTH_TOKEN" "BOT_UID" "HANGOUT_ID")
    for var in "${required_vars[@]}"; do
        if grep -q "^$var=" .env && ! grep -q "^$var=paste-" .env; then
            print_status "$var is configured"
        else
            print_warning "$var needs to be configured in .env"
        fi
    done
else
    print_error ".env file not found"
    echo "   Copy .env_example to .env and configure it:"
    echo "   cp .env_example .env"
    exit 1
fi

# Check 6: Test Docker build (optional)
echo
print_info "Testing Docker build (this may take a moment)..."
if docker build -t mrroboto:validation-test . &> /dev/null; then
    print_status "Docker build successful"
    # Clean up test image
    docker rmi mrroboto:validation-test &> /dev/null || true
else
    print_warning "Docker build failed - check your Dockerfile"
    echo "   Try running: docker build -t mrroboto:test ."
fi

echo
echo -e "${GREEN}🎉 Docker setup validation completed!${NC}"
echo
echo "Next steps:"
echo "  1. Configure your .env file if not already done"
echo "  2. Start the bot: ./docker.sh start"
echo "  3. Check logs: ./docker.sh logs"
echo
echo "For more help, see: docs/DOCKER_SETUP.md"
#!/bin/bash

# Script to fix .env file for Docker Compose compatibility
# Wraps all values in quotes to handle special characters

ENV_FILE=".env"
TEMP_FILE=".env.temp"
BACKUP_FILE=".env.backup.$(date +%Y%m%d_%H%M%S)"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ .env file not found!"
    exit 1
fi

echo "🔧 Fixing .env file for Docker Compose compatibility..."

# Determine which Docker Compose command to use
DOCKER_COMPOSE_CMD=""
if command -v docker-compose > /dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker-compose"
elif docker compose version > /dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
else
    echo "❌ Neither 'docker-compose' nor 'docker compose' is available."
    echo "   Please install Docker Compose."
    exit 1
fi

# Create backup
cp "$ENV_FILE" "$BACKUP_FILE"
echo "✅ Backup created: $BACKUP_FILE"

# Process the file
while IFS= read -r line; do
    if [[ $line =~ ^[[:space:]]*# ]] || [[ -z "${line// }" ]]; then
        # Keep comments and empty lines as-is
        echo "$line" >> "$TEMP_FILE"
    elif [[ $line =~ ^([^=]+)=(.*)$ ]]; then
        # Extract key and value
        key="${BASH_REMATCH[1]}"
        value="${BASH_REMATCH[2]}"
        
        # Remove existing quotes if present
        value="${value#\"}"
        value="${value%\"}"
        value="${value#\'}"
        value="${value%\'}"
        
        # Write with double quotes
        echo "${key}=\"${value}\"" >> "$TEMP_FILE"
    else
        # Keep other lines as-is
        echo "$line" >> "$TEMP_FILE"
    fi
done < "$ENV_FILE"

# Replace original file
mv "$TEMP_FILE" "$ENV_FILE"

echo "✅ .env file has been fixed!"
echo "🧪 Testing Docker Compose configuration..."

if $DOCKER_COMPOSE_CMD config --quiet > /dev/null 2>&1; then
    echo "✅ Docker Compose configuration is now valid!"
else
    echo "❌ Still having issues. Restoring backup..."
    mv "$BACKUP_FILE" "$ENV_FILE"
    echo "💡 Consider using environment variables directly instead of .env file"
    exit 1
fi

echo "🐳 Ready to run: $DOCKER_COMPOSE_CMD up -d"
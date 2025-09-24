#!/bin/bash

# Extract environment variables from .env.backup-original and create a clean .env file
# This removes the problematic JWT formatting issues

echo "🔧 Creating clean .env file from backup..."

if [ ! -f ".env.backup-original" ]; then
    echo "❌ .env.backup-original not found!"
    exit 1
fi

# Create a clean .env file with properly quoted values
echo "# Clean environment file for Docker Compose" > .env
echo "# Generated from .env.backup-original" >> .env
echo "" >> .env

while IFS= read -r line; do
    # Skip empty lines and comments
    if [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]]; then
        if [[ "$line" =~ ^[[:space:]]*# ]]; then
            echo "$line" >> .env
        fi
        continue
    fi
    
    # Extract key=value pairs
    if [[ "$line" =~ ^([^=]+)=(.*)$ ]]; then
        key="${BASH_REMATCH[1]}"
        value="${BASH_REMATCH[2]}"
        
        # Remove existing quotes if present
        value="${value#\"}"
        value="${value%\"}"
        value="${value#\'}"
        value="${value%\'}"
        
        # Write with double quotes to handle special characters
        echo "${key}=\"${value}\"" >> .env
    fi
done < ".env.backup-original"

echo "✅ Clean .env file created successfully!"
echo "🐳 You can now use: docker-compose up -d"
#!/bin/bash

# This script helps deploy your backend to Render

echo "Preparing to deploy KiranaApp backend to Render..."

# Check if Render CLI is installed
if ! command -v render &> /dev/null
then
    echo "Render CLI is not installed. You can deploy manually through the Render dashboard."
    echo "Visit https://render.com to sign up and create a new Web Service."
    echo ""
    echo "Instructions for manual deployment:"
    echo "1. Sign up or log in to Render"
    echo "2. Create a new Web Service"
    echo "3. Connect your GitHub repository"
    echo "4. Configure the following settings:"
    echo "   - Name: kiranaapp-backend"
    echo "   - Environment: Node"
    echo "   - Build Command: cd server && npm install && npm run build"
    echo "   - Start Command: cd server && npm start"
    echo "5. Add the following environment variables:"
    echo "   - NODE_ENV: production"
    echo "   - DB_USER: (your Neon database user)"
    echo "   - DB_HOST: (your Neon database host)"
    echo "   - DB_NAME: (your Neon database name)"
    echo "   - DB_PASSWORD: (your Neon database password)"
    echo "   - DB_PORT: 5432"
    echo "   - JWT_SECRET: (generate a random string)"
    echo "   - DATABASE_URL: (your full Neon database URL)"
    echo "6. Click 'Create Web Service'"
    exit 0
fi

# If Render CLI is installed, proceed with deployment
echo "Deploying to Render using render.yaml configuration..."
render deploy

echo "Deployment initiated! Check the Render dashboard for progress."
echo "Once deployed, your backend will be available at: https://kiranaapp-backend.onrender.com" 
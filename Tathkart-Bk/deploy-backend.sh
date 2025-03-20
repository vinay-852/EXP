#!/bin/bash

# This script deploys the backend to Heroku

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null
then
    echo "Heroku CLI is not installed. Please install it first."
    echo "Visit https://devcenter.heroku.com/articles/heroku-cli for installation instructions."
    exit 1
fi

# Check if logged in to Heroku
if ! heroku auth:whoami &> /dev/null
then
    echo "You are not logged in to Heroku. Please login first."
    heroku login
fi

# Create Heroku app if it doesn't exist
APP_NAME="kirana-app-backend"
if ! heroku apps:info $APP_NAME &> /dev/null
then
    echo "Creating Heroku app $APP_NAME..."
    heroku create $APP_NAME
else
    echo "Heroku app $APP_NAME already exists."
fi

# Add PostgreSQL addon
if ! heroku addons:info -a $APP_NAME postgresql &> /dev/null
then
    echo "Adding PostgreSQL addon..."
    heroku addons:create -a $APP_NAME heroku-postgresql:mini
else
    echo "PostgreSQL addon already exists."
fi

# Set environment variables
echo "Setting environment variables..."
heroku config:set -a $APP_NAME JWT_SECRET=$(openssl rand -hex 32)

# Deploy to Heroku
echo "Deploying to Heroku..."
git subtree push --prefix server heroku main

echo "Backend deployment completed!"
echo "Your backend is now available at https://$APP_NAME.herokuapp.com" 
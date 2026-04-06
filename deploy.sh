#!/bin/bash

# Woosh Finance Client Deployment Script
# This script automates the deployment process for the React client

set -e

echo "🚀 Starting Woosh Finance Client Deployment..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "❌ Not logged in to Vercel. Please login first:"
    vercel login
fi

# Build the project
echo "📦 Building the project..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed. dist directory not found."
    exit 1
fi

echo "✅ Build completed successfully!"

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
if [ "$1" = "--prod" ]; then
    echo "🚀 Deploying to production..."
    vercel --prod
else
    echo "🔧 Deploying to preview..."
    vercel
fi

echo "✅ Deployment completed!"
echo "📋 Next steps:"
echo "1. Set environment variables in Vercel dashboard:"
echo "   - VITE_API_URL=https://woosh-server.vercel.app/api"
echo "   - VITE_APP_NAME=Woosh Finance System"
echo "   - VITE_APP_VERSION=1.0.0"
echo "2. Test the deployed application"
echo "3. Configure custom domain if needed"

# Optional: Set environment variables via CLI
read -p "🤔 Would you like to set environment variables now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔧 Setting environment variables..."
    
    # Set API URL
    vercel env add VITE_API_URL production https://woosh-server.vercel.app/api
    
    # Set app name
    vercel env add VITE_APP_NAME production "Woosh Finance System"
    
    # Set app version
    vercel env add VITE_APP_VERSION production "1.0.0"
    
    echo "✅ Environment variables set!"
    echo "🔄 Redeploying with new environment variables..."
    vercel --prod
fi

echo "🎉 Deployment process completed!" 
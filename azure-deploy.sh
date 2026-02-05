#!/bin/bash

echo "🚀 Madio ERP Platinum - Azure Deployment Script"
echo "================================================"

RESOURCE_GROUP="madio-crm-rg"
LOCATION="centralindia"
APP_NAME="madio-crm-backend"
STATIC_APP_NAME="madio-crm-frontend"

if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI not found. Install: https://docs.microsoft.com/cli/azure/install-azure-cli"
    exit 1
fi

echo "📝 Logging into Azure..."
az login

echo "📦 Creating resource group: $RESOURCE_GROUP"
az group create --name $RESOURCE_GROUP --location $LOCATION

echo "🏗️  Creating App Service Plan (Free Tier)..."
az appservice plan create --name madio-crm-plan --resource-group $RESOURCE_GROUP --sku FREE --is-linux

echo "🌐 Creating Web App for backend..."
az webapp create --resource-group $RESOURCE_GROUP --plan madio-crm-plan --name $APP_NAME --runtime "PYTHON:3.11"

echo "⚙️  Configuring app settings..."
read -p "MongoDB URL: " MONGO_URL
read -p "Database Name: " DB_NAME
read -p "JWT Secret (leave blank to generate): " JWT_SECRET
read -p "SharePoint Client ID: " SP_CLIENT_ID
read -p "SharePoint Client Secret: " SP_CLIENT_SECRET
read -p "SharePoint Tenant ID: " SP_TENANT_ID
read -p "SharePoint Site URL: " SP_SITE_URL

if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    echo "✅ Generated JWT Secret: $JWT_SECRET"
fi

az webapp config appsettings set --resource-group $RESOURCE_GROUP --name $APP_NAME --settings \
    MONGO_URL="$MONGO_URL" \
    DB_NAME="$DB_NAME" \
    JWT_SECRET="$JWT_SECRET" \
    SHAREPOINT_CLIENT_ID="$SP_CLIENT_ID" \
    SHAREPOINT_CLIENT_SECRET="$SP_CLIENT_SECRET" \
    SHAREPOINT_TENANT_ID="$SP_TENANT_ID" \
    SHAREPOINT_SITE_URL="$SP_SITE_URL" \
    CORS_ORIGINS="*"

echo "📤 Deploying backend..."
cd backend
zip -r ../backend.zip .
az webapp deployment source config-zip --resource-group $RESOURCE_GROUP --name $APP_NAME --src ../backend.zip
cd ..

echo "🎨 Creating Static Web App for frontend..."
az staticwebapp create --name $STATIC_APP_NAME --resource-group $RESOURCE_GROUP --location $LOCATION

echo ""
echo "✅ Deployment Complete!"
echo "=================================="
echo "Backend URL: https://$APP_NAME.azurewebsites.net"
echo "Frontend: Configure in Azure Portal -> Static Web Apps"
echo ""
echo "Next Steps:"
echo "1. Update frontend API endpoint to: https://$APP_NAME.azurewebsites.net"
echo "2. Deploy frontend via GitHub Actions or Azure CLI"
echo "3. Configure custom domain (optional)"

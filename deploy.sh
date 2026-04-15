#!/bin/bash

# Deploy script for Tienda Magic on AWS EC2
# This script automates the initial deployment process

set -e  # Exit on any error

echo "🚀 Starting Tienda Magic deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
if [ ! -f .env ]; then
    print_error ".env file not found!"
    echo "Please create a .env file with the following variables:"
    echo "- DB_PASSWORD"
    echo "- REVERB_APP_ID"
    echo "- REVERB_APP_KEY"
    echo "- REVERB_APP_SECRET"
    echo "- STRIPE_KEY"
    echo "- STRIPE_SECRET"
    echo "- STRIPE_WEBHOOK_SECRET"
    exit 1
fi

# Load environment variables
source .env

print_status "Environment variables loaded successfully!"

# Check Docker and Docker Compose
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed!"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed!"
    exit 1
fi

print_status "Docker and Docker Compose are available!"

# Stop existing containers if running
print_status "Stopping existing containers..."
docker-compose down

# Set environment variables for Docker build
export NODE_ENV=production
export DOCKER_BUILD=true

# Build and start containers
print_status "Building and starting containers..."
docker-compose up --build -d

# Wait for database to be ready
print_status "Waiting for database to be ready..."
sleep 30

# Check if database is accessible
print_status "Checking database connection..."
docker-compose exec -T db pg_isready -U tienda_user -d tienda_magic

# Install PHP dependencies
print_status "Installing PHP dependencies..."
docker-compose exec -T app composer install --no-dev --optimize-autoloader

# Clear Laravel cache
print_status "Clearing Laravel cache..."
docker-compose exec -T app php artisan cache:clear
docker-compose exec -T app php artisan config:clear
docker-compose exec -T app php artisan route:clear
docker-compose exec -T app php artisan view:clear

# Run database migrations
print_status "Running database migrations..."
docker-compose exec -T app php artisan migrate --force

# Seed the database
print_status "Seeding the database..."
docker-compose exec -T app php artisan db:seed --force

# Import Scryfall API data
print_status "Importing Scryfall API data..."
docker-compose exec -T app php artisan scryfall:import-all

# Generate application key if not exists
print_status "Generating application key..."
docker-compose exec -T app php artisan key:generate --force

# Optimize Laravel for production
print_status "Optimizing Laravel for production..."
docker-compose exec -T app php artisan config:cache
docker-compose exec -T app php artisan route:cache
docker-compose exec -T app php artisan view:cache

# Set proper permissions
print_status "Setting proper permissions..."
docker-compose exec -T app chown -R www-data:www-data /var/www/html/storage
docker-compose exec -T app chown -R www-data:www-data /var/www/html/bootstrap/cache

# Check if all containers are running
print_status "Checking container status..."
docker-compose ps

# Health check
print_status "Performing health check..."
sleep 10

# Check nginx health
if curl -f http://localhost/health > /dev/null 2>&1; then
    print_status "✅ Nginx is healthy!"
else
    print_warning "⚠️  Nginx health check failed"
fi

# Check API health
if curl -f http://localhost/api/health > /dev/null 2>&1; then
    print_status "✅ API is healthy!"
else
    print_warning "⚠️  API health check failed"
fi

# Display useful information
echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Useful Information:"
echo "  - Web Server: http://localhost"
echo "  - API: http://localhost/api"
echo "  - WebSocket: ws://localhost:8080"
echo "  - Database: localhost:5432"
echo "  - Redis: localhost:6379"
echo ""
echo "🔧 Management Commands:"
echo "  - View logs: docker-compose logs -f"
echo "  - Stop services: docker-compose down"
echo "  - Restart services: docker-compose restart"
echo "  - Access app container: docker-compose exec app bash"
echo "  - Access database: docker-compose exec db psql -U tienda_user -d tienda_magic"
echo ""
echo "📝 Next Steps:"
echo "  1. Configure your domain name in nginx configuration"
echo "  2. Set up SSL certificates (Let's Encrypt recommended)"
echo "  3. Configure your Stripe webhook endpoints"
echo "  4. Set up monitoring and backups"
echo ""

print_status "Deployment process finished! 🚀"

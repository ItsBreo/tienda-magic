# Docker Deployment Guide for Tienda Magic

## Overview

This guide explains how to deploy Tienda Magic using Docker and Docker Compose on AWS EC2.

## Architecture

The deployment consists of 4 main services:

- **nginx**: Web server and reverse proxy (port 80/443)
- **app**: PHP 8.3-FPM with Laravel 11
- **reverb**: WebSocket server for real-time features
- **db**: PostgreSQL 16 database
- **redis**: Redis cache and session storage

## Prerequisites

- Docker and Docker Compose installed
- AWS EC2 instance with at least 2GB RAM
- SSL certificate (recommended for production)

## Development vs Production Build

### Development (Local)
- Uses `@laravel/vite-plugin-wayfinder` with PHP for type generation
- Run `npm run dev:full` to generate types and start dev server
- Run `npm run generate-types` to manually regenerate TypeScript types

### Production (Docker)
- Wayfinder plugin is automatically disabled
- No PHP dependency in Node.js build stage
- Uses pre-built static assets
- Environment variables `NODE_ENV=production` and `DOCKER_BUILD=true` trigger production mode

## Quick Start

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd tienda-magic
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` file with your credentials:**
   ```bash
   # Required variables
   DB_PASSWORD=your_secure_password
   REVERB_APP_ID=your_reverb_app_id
   REVERB_APP_KEY=your_reverb_app_key
   REVERB_APP_SECRET=your_reverb_app_secret
   STRIPE_KEY=your_stripe_publishable_key
   STRIPE_SECRET=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   ```

4. **Run the deployment script:**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

## Manual Deployment

If you prefer to deploy manually:

1. **Build and start containers:**
   ```bash
   docker-compose up --build -d
   ```

2. **Wait for database to be ready:**
   ```bash
   sleep 30
   ```

3. **Install dependencies and setup:**
   ```bash
   docker-compose exec app composer install --no-dev --optimize-autoloader
   docker-compose exec app php artisan migrate --force
   docker-compose exec app php artisan db:seed --force
   docker-compose exec app php artisan scryfall:import-all
   docker-compose exec app php artisan config:cache
   docker-compose exec app php artisan route:cache
   docker-compose exec app php artisan view:cache
   ```

## Service URLs

After deployment:

- **Web Application**: http://localhost
- **API**: http://localhost/api
- **WebSocket**: ws://localhost:8080
- **Health Check**: http://localhost/health

## Management Commands

```bash
# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f nginx
docker-compose logs -f app
docker-compose logs -f db

# Stop services
docker-compose down

# Restart services
docker-compose restart

# Access app container
docker-compose exec app bash

# Access database
docker-compose exec db psql -U tienda_user -d tienda_magic

# Update application
git pull
docker-compose up --build -d
```

## Environment Variables

### Required Variables

- `DB_PASSWORD`: PostgreSQL database password
- `REVERB_APP_ID`: Laravel Reverb application ID
- `REVERB_APP_KEY`: Laravel Reverb application key
- `REVERB_APP_SECRET`: Laravel Reverb application secret
- `STRIPE_KEY`: Stripe publishable key
- `STRIPE_SECRET`: Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret

### React Build Variables

- `VITE_API_URL`: API endpoint URL (default: http://localhost/api)
- `VITE_REVERB_HOST`: Reverb WebSocket host (default: localhost)
- `VITE_REVERB_PORT`: Reverb WebSocket port (default: 8080)
- `VITE_REVERB_SCHEME`: Reverb WebSocket scheme (default: http)
- `VITE_REVERB_APP_KEY`: Reverb application key for React (default: tiendamagic-key)
- `VITE_RECAPTCHA_SITE_KEY`: reCAPTCHA site key for production

### Optional Variables

- `APP_URL`: Application URL (default: http://localhost)
- `REDIS_PASSWORD`: Redis password (default: null)

## SSL Configuration

For production, configure SSL:

1. **Install certbot:**
   ```bash
   sudo apt-get update
   sudo apt-get install certbot python3-certbot-nginx
   ```

2. **Obtain certificate:**
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

3. **Update nginx configuration** in `docker/nginx/sites/default.conf`

## Monitoring

### Health Checks

- **Nginx**: `curl http://localhost/health`
- **API**: `curl http://localhost/api/health`

### Log Monitoring

```bash
# Real-time logs
docker-compose logs -f

# Error logs
docker-compose logs app | grep ERROR
```

## Backup Strategy

### Database Backup

```bash
# Create backup
docker-compose exec db pg_dump -U tienda_user tienda_magic > backup.sql

# Restore backup
docker-compose exec -T db psql -U tienda_user tienda_magic < backup.sql
```

### Application Backup

```bash
# Backup storage and uploads
docker run --rm -v tienda-magic_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/storage_backup.tar.gz -C /data .
```

## Troubleshooting

### Common Issues

1. **Database connection failed:**
   - Check if `DB_PASSWORD` is set correctly
   - Verify database container is running: `docker-compose ps`

2. **Permission denied errors:**
   ```bash
   docker-compose exec app chown -R www-data:www-data /var/www/html/storage
   ```

3. **WebSocket not working:**
   - Check Reverb container: `docker-compose logs reverb`
   - Verify port 8080 is accessible

4. **High memory usage:**
   - Increase EC2 instance RAM
   - Optimize PHP-FPM settings in `docker/php/php.ini`

### Performance Optimization

1. **Enable OPcache:** Already configured in `docker/php/php.ini`
2. **Use Redis for caching:** Already configured
3. **Enable gzip compression:** Already configured in nginx
4. **Use CDN for static assets:** Configure CloudFront or similar

## Security Considerations

1. **Change default passwords** in environment variables
2. **Use HTTPS** in production
3. **Implement rate limiting** (already configured)
4. **Regular security updates:** `docker-compose pull && docker-compose up -d`
5. **Firewall configuration:** Only expose necessary ports

## Scaling

### Horizontal Scaling

To scale the application:

```bash
# Scale app containers
docker-compose up --scale app=3 -d
```

### Load Balancing

Use AWS Application Load Balancer for high availability.

## Production Checklist

- [ ] Environment variables configured
- [ ] SSL certificate installed
- [ ] Database backups configured
- [ ] Monitoring set up
- [ ] Security groups configured
- [ ] Log rotation configured
- [ ] Performance testing completed
- [ ] Disaster recovery plan in place

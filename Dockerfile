# Multi-stage Dockerfile for Laravel 11 + React
# Stage 1: Build React assets
FROM node:20-alpine AS node_builder

# Define build arguments for React environment variables
ARG VITE_API_URL=http://localhost/api
ARG VITE_REVERB_HOST=localhost
ARG VITE_REVERB_PORT=8080
ARG VITE_REVERB_SCHEME=http
ARG VITE_REVERB_APP_KEY=tiendamagic-key
ARG VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key

# Set environment variables for Vite build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_REVERB_HOST=$VITE_REVERB_HOST
ENV VITE_REVERB_PORT=$VITE_REVERB_PORT
ENV VITE_REVERB_SCHEME=$VITE_REVERB_SCHEME
ENV VITE_REVERB_APP_KEY=$VITE_REVERB_APP_KEY
ENV VITE_RECAPTCHA_SITE_KEY=$VITE_RECAPTCHA_SITE_KEY

# Set Node environment for production build (disables wayfinder plugin)
ENV NODE_ENV=production
ENV DOCKER_BUILD=true

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --include=dev

# Copy source code
COPY . .

# Display environment variables for debugging
RUN echo "Building React with:" && \
    echo "VITE_API_URL=$VITE_API_URL" && \
    echo "VITE_REVERB_HOST=$VITE_REVERB_HOST" && \
    echo "VITE_REVERB_PORT=$VITE_REVERB_PORT" && \
    echo "VITE_REVERB_SCHEME=$VITE_REVERB_SCHEME" && \
    echo "VITE_REVERB_APP_KEY=$VITE_REVERB_APP_KEY"

# Build React assets with environment variables
RUN npm run build

# Stage 2: PHP Application
FROM php:8.4-fpm-alpine AS app

# Install system dependencies
RUN apk add --no-cache \
    postgresql-dev \
    libzip-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    libxml2-dev \
    icu-dev \
    zip \
    unzip \
    curl \
    git \
    supervisor

# Install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo_pgsql \
        pgsql \
        gd \
        zip \
        intl \
        bcmath \
        opcache \
        xml \
        dom \
        simplexml \
        pcntl

# Compile and install Redis extension for maximum performance
RUN apk add --no-cache $PHPIZE_DEPS linux-headers \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del $PHPIZE_DEPS linux-headers

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy PHP configuration
COPY docker/php/php.ini /usr/local/etc/php/conf.d/custom.ini

# Copy Laravel application files
COPY . .

# Copy built React assets from node stage
COPY --from=node_builder /app/public/build ./public/build

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage \
    && chmod -R 755 /var/www/html/bootstrap/cache

# Copy supervisord configuration
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Create folder for supervisor logs
RUN mkdir -p /var/log/supervisor

# Expose port
EXPOSE 9000

# Start supervisord
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]

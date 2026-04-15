-- PostgreSQL initialization script for Tienda Magic
-- This script runs when the database container is first created

-- Create additional extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set timezone
SET timezone = 'UTC';

-- Create indexes for better performance (will be created after migrations)
-- These are just examples, actual indexes should be created in migrations

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE tienda_magic TO tienda_user;

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'Tienda Magic database initialized successfully';
END $$;

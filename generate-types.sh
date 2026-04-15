#!/bin/bash

# Script to generate Wayfinder types for development
# This script should be run locally during development, not in Docker production builds

echo "🔧 Generating Wayfinder types for development..."

# Check if PHP is available
if ! command -v php &> /dev/null; then
    echo "❌ PHP is not available. Please run this script in your local development environment."
    exit 1
fi

# Check if artisan exists
if [ ! -f "artisan" ]; then
    echo "❌ Laravel artisan file not found. Please run this script from the project root."
    exit 1
fi

# Generate Wayfinder types
echo "📝 Running: php artisan wayfinder:generate --form-variants"
php artisan wayfinder:generate --form-variants

echo "✅ Wayfinder types generated successfully!"
echo ""
echo "📋 Generated files:"
echo "  - resources/js/types/routes.d.ts"
echo "  - resources/js/types/ziggy.d.ts"
echo "  - resources/js/types/forms.d.ts (if form variants are enabled)"
echo ""
echo "🔄 You can now run 'npm run dev' to start the development server."

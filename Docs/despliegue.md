Guía de Despliegue - AWS Producción

1. Requisitos de la Instancia (EC2)
Hardware: t3.micro (1GB RAM).

SO: Ubuntu 22.04 LTS.

Red: IP Elástica asociada.

Security Group (Puertos): >   - 22 (SSH)

80 (HTTP)

443 (HTTPS)

8080 (Opcional - Reverb)

2. Configuración Inicial de la MV
Instalar Docker y Compose
Bash
sudo apt update && sudo apt upgrade -y
sudo apt install docker.io docker-compose -y
sudo usermod -aG docker ubuntu

# Reiniciar sesión para aplicar grupos
Configurar SWAP (Obligatorio para t3.micro)
Sin esto, la compilación de React cuelga la máquina por falta de RAM.

Bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

3. Estructura de Producción
Backend: Laravel + PHP-FPM (Docker).

BD: MySQL 8.0 (Docker).

Frontend: React/Vite (Build estático).

Regla: Solo pull de la rama main. No se toca nada en AWS que no esté mergeado.

4. Actualizar Servidor
SSH y Git
Bash
ssh -i llave.pem ubuntu@13.38.90.100
cd tienda-magic
git pull origin main
Backend y Migraciones
Bash
docker exec -it tienda_magic_app php artisan optimize:clear
docker exec -it tienda_magic_app composer install --no-dev --optimize-autoloader
docker exec -it tienda_magic_app php artisan migrate --force
Build de Frontend
Bash
docker run --rm -v $(pwd):/app -w /app node:20 sh -c "npm run build"

5. Base de Datos (Seeding)
Cargar fakes: docker exec -it tienda_magic_app php artisan db:seed --force

Reset completo: docker exec -it tienda_magic_app php artisan migrate:fresh --seed --force (⚠️ Borra todo).

6. Troubleshooting
Logs: docker exec -it tienda_magic_app tail -n 50 storage/logs/laravel.log

Restart: docker-compose down && docker-compose up -d

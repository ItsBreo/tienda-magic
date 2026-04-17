# 🚀 Guía de Ejecución Definitiva - Tienda Magic

Esta guía describe los pasos exactos para configurar y ejecutar el proyecto **Tienda Magic** desde cero, asegurando que tengas todas las funcionalidades (cartas, mercado, foros y logros) operativas.

---

## 🛠️ 1. Requisitos Previos

Asegúrate de tener instalados los siguientes componentes en tu máquina:

1.  **PHP 8.2+** y **Composer**.
2.  **Node.js 18+** y **NPM**.
3.  **Docker Desktop** (Obligatorio para la base de datos y servicios).
4.  **Git** (Para clonar el proyecto).

---

## 🏗️ 2. Configuración Inicial

Sigue estos comandos en orden para preparar el entorno:

```bash
# 1. Instalar dependencias del Backend
composer install

# 2. Instalar dependencias del Frontend
npm install

# 3. Configurar el entorno
cp .env.example .env

# 4. Generar la clave de seguridad de Laravel
php artisan key:generate
```

> [!IMPORTANT]
> Revisa tu archivo `.env` y asegúrate de que las credenciales de la base de datos coincidan con las de `docker-compose.yaml` (por defecto: `tienda_magic`, `postgres`, `1234`).

---

## 🐋 3. Infraestructura (Docker)

Levanta la base de datos PostgreSQL y el servicio de Websockets (Reverb):

```bash
docker-compose up -d
```
*Verifica en Docker Desktop que los contenedores `tienda-magic-db-1` y `tienda-magic-reverb-1` están en verde.*

---

## 🗄️ 4. Base de Datos y Almacenamiento

Prepara la estructura de datos y los enlaces de archivos:

```bash
# 1. Crear tablas e inicializar datos base (Roles, Foros, Usuarios de prueba)
php artisan migrate:fresh --seed

# 2. Crear el enlace simbólico para las imágenes de las cartas
php artisan storage:link
```

---

## 🃏 5. Ingesta de Datos (Sincronización Scryfall)

Para que la tienda y el mercado tengan contenido, debes importar los datos de Magic: The Gathering en este **orden obligatorio**:

1.  **Sincronizar Expansiones (Sets):**
    ```bash
    php artisan scryfall:sync-sets
    ```
2.  **Sincronizar Catálogo Maestro (Cartas):**
    *(Este paso puede tardar varios minutos dependiendo de tu conexión).*
    ```bash
    php artisan scryfall:sync-master
    ```
3.  **Generar Productos (Sobres) para la Tienda:**
    ```bash
    php artisan shop:generate-packs
    ```
4.  **Generar Historial del Mercado (Opcional):**
    ```bash
    php artisan market:seed-history
    ```

---

## 🚀 6. Ejecución de la Aplicación

Necesitas mantener **dos terminales** abiertas:

**Terminal 1 (Backend):**
```bash
php artisan serve
```

**Terminal 2 (Frontend/Vite):**
```bash
npm run dev
```

Accede a la web en: [http://127.0.0.1:8000](http://127.0.0.1:8000)

---

## 👥 7. Cuentas de Prueba (Seeders)

El sistema genera automáticamente las siguientes cuentas para desarrollo (contraseña: `password` para todos):

| Rol | Email | Uso |
|-----|-------|-----|
| **Super Admin** | `superadmin@ejemplo.com` | Control total del sistema y RBAC |
| **Admin** | `admin@ejemplo.com` | Gestión de inventario y mercado |
| **Moderador** | `modnoticias@ejemplo.com` | Gestión de foros específicos |
| **Usuario** | `usuario@ejemplo.com` | Perfil de jugador estándar |

---

## 💳 8. Configuración de Stripe (Pagos)

Para probar la billetera y las recargas de saldo:

1.  Configura tus claves en el `.env`:
    *   `STRIPE_KEY`: Tu clave pública de Stripe.
    *   `STRIPE_SECRET`: Tu clave secreta de Stripe.
    *   `STRIPE_WEBHOOK_SECRET`: Clave para validar pagos automáticos.
2.  **Webhook local**: Si estás en Windows, puedes usar el ejecutable incluido para redirigir eventos de Stripe a tu servidor local:
    ```bash
    ./stripe.exe listen --forward-to localhost:8000/api/stripe/webhook
    ```

---

## 🌐 9. Notas para Producción

Si decides desplegar este proyecto en un servidor real:

-   **Servidor Web**: Usa Nginx o Apache configurado para apuntar a la carpeta `/public`.
-   **Build**: Ejecuta `npm run build` para generar los archivos estáticos optimizados.
-   **Optimización**: Ejecuta `php artisan config:cache` y `php artisan route:cache`.
-   **Procesos**: Usa **Supervisor** para mantener vivos los procesos de `php artisan queue:work` y el servidor de Reverb.

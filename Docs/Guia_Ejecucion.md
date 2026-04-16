# 🚀 Guía de Inicio Rápido - Tienda Magic

Esta guía contiene los pasos exactos para levantar el proyecto desde cero y ver la aplicación en tu navegador.

## 🛠️ Requisitos Previos
1.  **Docker Desktop**: Debe estar abierto y funcionando.
2.  **PHP 8.2+** y **Composer**.
3.  **Node.js 18+** y **NPM**.

---

## 🏗️ Paso 1: Configuración Inicial
Si es la primera vez, asegúrate de tener el archivo `.env` configurado (ya lo he actualizado con tus claves de Stripe y la DB correcta).

```bash
# Instalar dependencias del Backend
composer install

# Instalar dependencias del Frontend
npm install

# Generar la clave de la aplicación
php artisan key:generate
```

## 🐋 Paso 2: Levantar la Infraestructura
Abre **Docker Desktop** y luego ejecuta:

```bash
docker-compose up -d
```
*Esto iniciará la base de datos PostgreSQL en segundo plano.*

## 🗄️ Paso 3: Base de Datos
Ejecuta las migraciones para crear las tablas:

```bash
php artisan migrate
```

## 🎨 Paso 4: Construcción del Frontend
Compila los activos de React:

```bash
npm run build
```

---

## 🚀 Paso 5: Ejecutar la Aplicación
Necesitas abrir **dos terminales** diferentes:

**Terminal 1 (Backend):**
```bash
php artisan serve
```

**Terminal 2 (Frontend/Vite):**
```bash
npm run dev
```

Ahora puedes abrir tu navegador en: [http://127.0.0.1:8000](http://127.0.0.1:8000)

---

## 🃏 Paso 6: Sincronizar Cartas (Scryfall)
Para que la tienda tenga productos, debes importar los datos de Scryfall en este orden **estricto**:

1.  **Sincronizar Expansiones (Sets):**
    ```bash
    php artisan scryfall:sync-sets
    ```
2.  **Sincronizar Cartas (Catálogo Maestro):**
    ```bash
    php artisan scryfall:sync-master
    ```
    *(Nota: Este proceso descarga miles de cartas y puede tardar varios minutos).*
3.  **Generar Sobres para la Tienda:**
    ```bash
    php artisan shop:generate-packs
    ```

---

### 💡 Comandos Extra
- `php artisan db:seed` (Si quieres cargar datos de prueba adicionales).
- `php artisan scryfall:sync-master --batch-size=500` (Si quieres procesar lotes más pequeños para evitar problemas de memoria).

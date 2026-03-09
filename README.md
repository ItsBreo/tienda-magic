---

# 🃏 TCG Marketplace & Social Platform

Plataforma integral para el coleccionismo, compraventa y gestión de cartas coleccionables (TCG), diseñada con una arquitectura moderna, escalable y centrada en una economía digital segura.

## 📖 Sobre el Proyecto

Este proyecto es una solución completa *Full-Stack* que simula y gestiona un ecosistema de cartas coleccionables (basado en datos reales de *Magic: The Gathering*). No es solo una tienda, es una **red social de coleccionismo** donde los usuarios pueden abrir sobres virtuales, construir mazos, gestionar su inventario y, lo más importante, comerciar con otros usuarios en un entorno seguro.

El sistema implementa una **economía de ciclo cerrado** (estilo Steam Wallet), lo que permite microtransacciones fluidas, un mercado secundario P2P (Peer-to-Peer) y un sistema de trueque (Trading Room) robusto.

## 💡 ¿Por qué se ha hecho este proyecto?

El mercado de TCG digital a menudo carece de una integración fluida entre la base de datos de cartas, la gestión de inventario personal y el comercio social.

Este proyecto nace para resolver tres desafíos técnicos y de producto:

1. **Seguridad en el Intercambio P2P:** A diferencia de los foros tradicionales donde el pago es inseguro, aquí implementamos un sistema de **"Wallet" transaccional** con auditoría financiera completa. El dinero real entra una vez y circula dentro de la plataforma, eliminando fraudes en pagos directos.
2. **Experiencia de Coleccionismo Realista:** Queríamos ir más allá de una simple lista de cartas. Implementamos la mecánica de **Sobres Cerrados (Sealed Packs)** vs. **Cartas Sueltas**, permitiendo a los usuarios decidir si abrir sus productos o guardarlos como inversión, tal como en la vida real.
3. **Datos Vivos y Reales:** En lugar de inventar cartas, nos sincronizamos con la API de **Scryfall** para tener datos verídicos, legales y actualizados, incluyendo un **Historial de Precios** que permite ver la fluctuación del mercado día a día.

## 🛠️ Stack Tecnológico

Este proyecto utiliza las versiones más recientes y potentes del mercado para garantizar rendimiento y escalabilidad:

* **Backend:** [Laravel](https://laravel.com) **v12.36** 🚀
* Uso de *Service Container* y *Artisan Commands* para tareas pesadas.
* API RESTful organizada por dominios (`Api/Shop`, `Api/Market`, etc.).
* Sistema de Migraciones "Code-First" con 28 tablas.
* **JWT Authentication** implementado para autenticación vía tokens.

* **Frontend:** [React](https://react.dev)
* Arquitectura SPA (Single Page Application).
* Hooks personalizados para búsquedas y gestión de estado.
* Interfaz reactiva con actualizaciones en tiempo real.

* **Base de Datos:** [PostgreSQL](https://www.postgresql.org) **(Latest Version)**
* Uso avanzado de tipos de datos `JSON` para almacenar metadatos complejos de cartas (Scryfall Data).
* Transacciones ACID estrictas para asegurar la integridad financiera del *Wallet*.
* Búsquedas optimizadas con `ilike` e índices compuestos.
* **Seguridad SQL Injection** implementada con Eloquent ORM y validaciones.

* **Integraciones:**
* **Scryfall API:** Fuente de verdad para datos de cartas y precios.
* **Stripe/PayPal (Simulado):** Pasarela para recarga de saldo real.

* **Documentación:**
* **Modelo UML** completo en `docs/UML-Model.md`
* **Guías técnicas** para desarrollo y despliegue



## 🌟 Funcionalidades Clave

### 💰 Economía "Steam Wallet"

* Sistema de saldo virtual respaldado por dinero real.
* Registro inmutable de transacciones (`WALLET_TRANSACTION`) para auditoría.
* Soporte para recargas y comisiones de plataforma.

### 🏪 Tienda y Mercado Secundario

* **Tienda Oficial:** Compra de sobres generados por el sistema (Draft, Collector, etc.).
* **Mercado P2P:** Los usuarios venden cartas de su inventario. El sistema gestiona la transferencia de propiedad y el movimiento de saldo, cobrando una comisión automática.

### 🤝 Sala de Intercambio (Trading Room)

* Sistema de trueque donde dos usuarios negocian cartas (objeto por objeto).
* Estados de negociación: *Ofertando -> Bloqueado -> Completado*.

### 🎒 Inventario Híbrido & Privacidad

* Gestión de **Sobres sin abrir** e **Inventario de Cartas**.
* Sistema de privacidad: Perfiles públicos o privados con opción de bloquear solicitudes de intercambio.

### 📈 Gamificación y Social

* **Logros:** Sistema de recompensas desbloqueables.
* **Foros:** Estructura jerárquica (Categoría -> Hilo -> Comentario).
* **Perfiles:** Avatares, reputación (Karma) y biografía.

## 🗄️ Esquema de Base de Datos

El proyecto cuenta con una arquitectura de base de datos relacional robusta diseñada en PostgreSQL con:

- **28 tablas** interconectadas mediante migraciones Laravel
- **Modelo UML** completo documentado en `docs/UML-Model.md`
- **Relaciones Eloquent** optimizadas para rendimiento
- **Índices y restricciones** para integridad referencial
- **Tipos JSON** para metadatos complejos de Scryfall API

## 🚀 Instalación y Despliegue

Este proyecto integra Backend y Frontend en un único repositorio para facilitar el desarrollo y despliegue.

### Prerrequisitos
* PHP 8.2+
* Composer
* Node.js & NPM
* PostgreSQL
* **Docker Desktop** (requerido para base de datos)

### Paso a Paso

1.  **Clonar el repositorio:**
    ```bash
    git clone [https://github.com/tu-usuario/tu-proyecto-tcg.git](https://github.com/tu-usuario/tu-proyecto-tcg.git)
    cd tu-proyecto-tcg
    ```

2.  **Instalar dependencias de Backend (Laravel):**
    ```bash
    composer install
    ```

3.  **Instalar dependencias de Frontend (React):**
    ```bash
    npm install
    ```

4.  **Configurar Entorno:**
    ```bash
    cp .env.example .env
    php artisan key:generate
    # Configura tu base de datos en el archivo .env (DB_CONNECTION=pgsql...)
    ```
    
    **Importante:** 
    - Asegúrate de que **Docker Desktop** esté ejecutándose
    - Ejecuta `docker-compose up -d` para iniciar el contenedor PostgreSQL
    - Para producción, configura tus propias claves de reCAPTCHA en `.env`:
      ```bash
      VITE_RECAPTCHA_SITE_KEY=tu_clave_real
      RECAPTCHA_SECRET_KEY=tu_secreto_real
      ```

5.  **Base de Datos y Seeds:**
    ```bash
    # Crear base de datos PostgreSQL
    createdb tienda_magic
    
    # Ejecutar migraciones (compatible con PostgreSQL)
    php artisan migrate
    
    # Importar cartas desde Scryfall API
    php artisan scryfall:sync-cards --set=neo --limit=50
    ```

## 🃏 Importar Datos de Scryfall

Para poblar la tienda con cartas y sobres reales:

```bash
# Sincronizar sets de Magic
php artisan scryfall:sync-sets

# Importar cartas (12 sets recientes, hasta 200 cartas por set)
php artisan scryfall:sync-cards --limit=1000

# Generar booster packs para todos los sets
php artisan shop:generate-packs

# Generar pack para un set específico (nuevo comando)
php artisan app:generate-specific-pack CODIGO_SET

# Ejemplos de packs específicos:
php artisan app:generate-specific-pack neo    # Kamigawa: Neon Dynasty
php artisan app:generate-specific-pack mom    # March of the Machine
php artisan app:generate-specific-pack woe    # Wilds of Eldraine
```

### Comandos Adicionales
- `php artisan scryfall:sync-cards --set=BLR --limit=500` - Importar set específico
- `php artisan serve` - Iniciar backend
- `npm run dev` - Iniciar frontend

6.  **Ejecutar en Desarrollo:**
    Necesitarás dos terminales abiertas simultáneamente (o usar una herramienta como *Tmux*):

    * **Terminal 1 (Servidor Laravel):**
        ```bash
        php artisan serve
        ```
    
    * **Terminal 2 (Compilador Vite - React):**
        ```bash
        npm run dev
        ```
    
    Vite detectará los cambios en tus archivos `.jsx` y recargará la página automáticamente (Hot Module Replacement).

7.  **Compilar para Producción:**
    Cuando subas el proyecto al servidor real:
    ```bash
    npm run build
    ```
    Esto generará los archivos estáticos optimizados en la carpeta `public/build`.

## 📄 Licencia

Este proyecto está bajo la licencia [MIT](https://opensource.org/licenses/MIT).

---

*Desarrollado con ❤️ para los amantes del TCG.*

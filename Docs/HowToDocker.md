# 🐳 Guía Docker - Tienda Magic

Esta guía te muestra paso a paso cómo configurar y ejecutar el proyecto Tienda Magic usando Docker.

## 📋 ¿Por qué Docker?

Docker nos permite tener un **ambiente consistente** en desarrollo. Sin importar si trabajas en Mac, Windows o Linux, Docker garantiza que:

- ✅ La base de datos funcione igual
- ✅ No tengas conflictos entre versiones
- ✅ El código se comporta igual en desarrollo y producción
- ✅ Cualquier pessoa pueda levantar el proyecto sin complicaciones

## 🛠️ Requisitos Previos

Antes de empezar, asegúrate de tener instalado:

- **Docker Desktop** ([descargar](https://www.docker.com/products/docker-desktop)) - Incluye Docker y Docker Compose
- **Git** - Para clonar el repositorio
- Un editor de código (VS Code recomendado)

Para verificar que está instalado:

```bash
docker --version
docker-compose --version
```

Deberías ver versiones de Docker y Docker Compose.

## 📁 Estructura del Proyecto

En la raíz del proyecto tienes `docker-compose.yaml`:

```yaml
services:
  db:
    image: postgres:15
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: tienda-magic
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: 1234
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

**¿Qué significa esto?**

| Componente | Explicación |
|-----------|-----------|
| `db` | Nombre del servicio (base de datos) |
| `postgres:15` | Imagen a usar (PostgreSQL versión 15) |
| `ports` | Abre el puerto 5432 en tu máquina para conectarte |
| `environment` | Variables de entorno para PostgreSQL |
| `volumes` | Almacena datos persistentes en `pgdata` |

## ⚙️ Paso 1: Configurar el `.env`

Docker levanta PostgreSQL, pero tu aplicación Laravel también necesita saber cómo conectarse.

### 1.1 Crear el archivo `.env`

```bash
cp .env.example .env
```

### 1.2 Modificar las variables de base de datos

Abre `.env` y busca la sección de `DB_CONNECTION`. **Reemplaza esto:**

```env
# Database Configuration (DESACTIVA ESTO PARA DOCKER)
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=laravel
DB_USERNAME=root
DB_PASSWORD=
```

**Por esto:**

```env
# Database Configuration (ACTIVA PARA DOCKER)
DB_CONNECTION=pgsql
DB_HOST=db
DB_PORT=5432
DB_DATABASE=tienda-magic
DB_USERNAME=postgres
DB_PASSWORD=1234
```

### ¿Por qué estos valores?

- `DB_CONNECTION=pgsql` → Usa PostgreSQL (no MySQL)
- `DB_HOST=db` → El nombre del servicio en `docker-compose.yaml`
- `DB_PORT=5432` → Puerto estándar de PostgreSQL
- `DB_DATABASE=tienda-magic` → Nombre de la BD (definido en docker-compose)
- `DB_USERNAME=postgres` → Usuario (definido en docker-compose)
- `DB_PASSWORD=1234` → Contraseña (definida en docker-compose)

### 1.3 Generar la clave de aplicación

Si aún no lo has hecho:

```bash
php artisan key:generate
```

Esto llena `APP_KEY` en tu `.env`.

## 🚀 Paso 2: Levantando Docker

### 2.1 Iniciar los contenedores

Colócate en la raíz del proyecto y ejecuta:

```bash
docker-compose up -d
```

**¿Qué significa `-d`?**

- `-d` = "detached" (ejecuta en segundo plano)
- Sin `-d`, verías todos los logs, esto a veces es útil para debugging

**Primera vez:** Docker **descargará la imagen de PostgreSQL** (puede tardar unos minutos).

### 2.2 Verificar que está corriendo

```bash
docker-compose ps
```

Deberías ver algo así:

```
NAME                COMMAND             STATUS
tienda-magic-db-1   "docker-entrypoint…"   Up 2 minutes
```

Si ves `Up`, ¡significa que PostgreSQL está corriendo! 🎉

## 📦 Paso 3: Instalar Dependencias y Migrar

Ahora tu base de datos está lista, pero necesita las tablas.

### 3.1 Instalar dependencias de Laravel

```bash
composer install
```

### 3.2 Ejecutar migraciones

```bash
php artisan migrate
```

Esto crea todas las tablas en PostgreSQL.

### 3.3 (Opcional) Importar datos desde Scryfall

Si quieres cargar las cartas reales:

```bash
php artisan scryfall:import neo
```

Este comando tarda dependiendo del volumen de datos.

## 🎮 Paso 4: Ejecutar el Servidor

Abre **dos terminales diferentes** en la raíz del proyecto:

### Terminal 1: Servidor Laravel

```bash
php artisan serve
```

Te mostrará algo como:

```
Laravel development server started: http://127.0.0.1:8000
```

### Terminal 2: Frontend (Vite)

```bash
npm run dev
```

Vite compilará los assets y te indicará dónde acceder (típicamente `http://localhost:5173`).

**¡Listo!** Ahora puedes acceder a `http://localhost:8000` (o el puerto que muestre) en tu navegador.

## 🛑 Paso 5: Detener Docker

Cuando termines de trabajar:

```bash
docker-compose down
```

Esto **detiene** los contenedores pero **preserva los datos** (gracias a los volúmenes).

## 🔧 Comandos útiles

### Ver logs de la base de datos

```bash
docker-compose logs db
```

Muestra los últimos logs de PostgreSQL. Útil para debugging.

### Acceder a la BD directamente (psql)

```bash
docker-compose exec db psql -U postgres -d tienda-magic
```

Esto abre una consola de PostgreSQL. Prueba:

```sql
\dt  -- Lista todas las tablas
SELECT * FROM users;  -- Consulta usuarios
\q   -- Salir
```

### Reiniciar los contenedores

```bash
docker-compose restart
```

### Eliminar todo y empezar de cero

⚠️ **Esto borra la base de datos:**

```bash
docker-compose down -v
```

Luego puedes hacer `docker-compose up -d` de nuevo.

## ❌ Solucionar Problemas

### Error: "Puerto 5432 ya está en uso"

Otro servicio está usando el puerto. Opciones:

**Opción 1:** Cambiar el puerto en `docker-compose.yaml`:

```yaml
ports:
  - "5433:5432"  # Usa 5433 en tu máquina
```

Luego actualiza `.env`:

```env
DB_PORT=5433
```

**Opción 2:** Detener el otro servicio:

```bash
# En Mac/Linux
lsof -i :5432
kill -9 <PID>
```

### Error: "Cannot connect to the Docker daemon"

Docker Desktop no está corriendo. Abre Docker Desktop y espera a que se inicie completamente.

### Error: "Database refused connection"


### Error: "No such file or directory: 'docker-compose.yaml'"

Asegúrate de estar en la **raíz del proyecto**:

```bash
pwd  # Verifica dónde estás
ls docker-compose.yaml  # Verifica que existe
```

### Error: "SQLSTATE[HY000]: General error: 1030"

Generalmente un problema de conexión a la BD. Verifica:

```bash
# ¿Está corriendo?
docker-compose ps

# ¿Es correcto el .env?
grep DB_ .env

# ¿Puedes conectarte?
docker-compose exec db psql -U postgres -d tienda-magic
```

## 📊 Flujo Típico de Trabajo

```bash
# Cuando empiezas el día:
docker-compose up -d
php artisan serve          # Terminal 1
npm run dev                # Terminal 2

# ... trabaja normalmente ...

# Cuando terminas:
docker-compose down
```

## 🔐 Seguridad en Producción

⚠️ **IMPORTANTE:** Las credenciales en `docker-compose.yaml` son SOLO para desarrollo local.

Para producción:

- ❌ NO uses contraseñas hardcodeadas en archivos
- ✅ Usa **variables de entorno reales** o **secrets de Docker**
- ✅ Usa contraseñas **fuertes** (no `1234`)
- ✅ Cambia puertos y usuarios según el ambiente

## 📚 Recursos Adicionales

- [Documentación oficial de Docker](https://docs.docker.com/)
- [Documentación de Docker Compose](https://docs.docker.com/compose/)
- [PostgreSQL en Docker](https://hub.docker.com/_/postgres)
- [Laravel + Docker](https://laravel.com/docs/11/deployment/docker)

---

¿Problemas? Revisa los logs con `docker-compose logs` o abre un issue en el repositorio. 🚀

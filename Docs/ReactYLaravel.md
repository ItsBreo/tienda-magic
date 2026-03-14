# 🚀 Guía de Instalación - Tienda Magic

Esta guía te muestra cómo instalar y ejecutar Tienda Magic desde cero en tu máquina, sin importar si nunca has trabajado con PHP o React.

## 📋 ¿Qué necesitas?

Tienda Magic es un proyecto **Full-Stack** que usa:

- **Backend:** Laravel (PHP)
- **Frontend:** React (JavaScript)
- **Base de Datos:** PostgreSQL

No necesitas saber qué es cada cosa ahora; la guía te explica todo paso a paso.

## 💻 Paso 1: Instalar las Herramientas Base

### 1.1 Instalar Git

Git es un sistema de control de versiones que necesitas para descargar el proyecto.

#### En Mac (con Homebrew)

Si no tienes Homebrew, instálalo primero desde [brew.sh](https://brew.sh)

```bash
brew install git
```

#### En Windows

Descarga desde [git-scm.com](https://git-scm.com/download/win) e instala.

#### En Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install git
```

**Verifica la instalación:**

```bash
git --version
```

Deberías ver algo como `git version 2.40.0`.

---

### 1.2 Instalar PHP

PHP es el lenguaje en el que está escrito Laravel (el backend).

#### En Mac

**Con Homebrew:**

```bash
brew install php@8.2
```

**Agregar PHP al PATH (para usarlo en terminal):**

```bash
echo 'export PATH="/opt/homebrew/opt/php@8.2/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

#### En Windows

Ve a [php.net/downloads](https://www.php.net/downloads.php), descarga PHP 8.2 y sigue las instrucciones. Luego agrega PHP al PATH.

#### En Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install php8.2 php8.2-xml php8.2-curl php8.2-pgsql
```

**Verifica la instalación:**

```bash
php --version
```

Deberías ver `PHP 8.2.x`.

---

### 1.3 Instalar Composer

Composer es el "gestor de paquetes" de PHP. Piensa en él como `npm` pero para PHP.

#### En Mac

```bash
brew install composer
```

#### En Windows

Descarga desde [getcomposer.org](https://getcomposer.org/Composer-Setup.exe) e instala.

#### En Linux

```bash
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
```

**Verifica la instalación:**

```bash
composer --version
```

Deberías ver `Composer version 2.x.x`.

---

### 1.4 Instalar Node.js y npm

Node.js es un entorno de JavaScript. npm es su gestor de paquetes (como Composer para PHP).

#### En Mac

```bash
brew install node
```

#### En Windows

Descarga desde [nodejs.org](https://nodejs.org) (elige la versión LTS) e instala.

#### En Linux

```bash
sudo apt update
sudo apt install nodejs npm
```

**Verifica la instalación:**

```bash
node --version
npm --version
```

Deberías ver versiones como `v18.x.x` y `9.x.x`.

---

### 1.5 Instalar PostgreSQL

PostgreSQL es la base de datos del proyecto.

#### En Mac

```bash
brew install postgresql
```

Para iniciar PostgreSQL en tu Mac:

```bash
brew services start postgresql
```

#### En Windows

Descarga desde [postgresql.org/download/windows](https://www.postgresql.org/download/windows/) e instala.

#### En Linux

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Verifica la instalación:**

```bash
psql --version
```

Deberías ver `psql (PostgreSQL) 15.x`.

---

## 📥 Paso 2: Clonar el Repositorio

Ahora que tienes las herramientas, descargamos el proyecto.

Choose a folder donde quieras el proyecto (por ejemplo, `~/Proyectos`):

```bash
mkdir -p ~/Proyectos
cd ~/Proyectos
```

Clona el repositorio:

```bash
git clone https://github.com/tu-usuario/tienda-magic.git
cd tienda-magic
```

Reemplaza `tu-usuario` con el usuario/organización real.

**Verifica que está todo:**

```bash
ls -la
```

Deberías ver archivos como `README.md`, `package.json`, `composer.json`, etc.

---

## 🔧 Paso 3: Configurar el Proyecto - Backend (Laravel)

### 3.1 Instalar dependencias de PHP

```bash
composer install
```

Esto descarga todas las librerías de PHP que necesita Laravel. **Puede tardar un par de minutos.**

### 3.2 Generar clave JWT

Como el proyecto usa JWT para autenticación (en lugar de Inertia), necesitamos generar la clave secreta:

```bash
php artisan jwt:secret
```

Esto añadirá `JWT_SECRET` a tu archivo `.env`.

### 3.3 Copiar el archivo `.env`

```bash
cp .env.example .env
```

Esto crea un archivo de configuración local. Nunca compartas este archivo.

### 3.4 Generar la clave de la aplicación

```bash
php artisan key:generate
```

Esto rellena `APP_KEY` en el `.env` (necesario para encriptación).

### 3.5 Configurar la base de datos

Abre el archivo `.env` en tu editor (VS Code):

```bash
code .env
```

Busca la sección `DB_*` y **reemplaza esto:**

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=laravel
DB_USERNAME=root
DB_PASSWORD=
```

**Por esto:**

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=tienda_magic
DB_USERNAME=postgres
DB_PASSWORD=
```

**Ahora crear la base de datos:**

En Mac/Linux, abre una terminal y ejecuta:

```bash
createdb tienda_magic
```

En Windows, abre pgAdmin (se instala con PostgreSQL) y crea una BD manualmente llamada `tienda_magic`.

**Verifica que funciona:**

```bash
psql -U postgres -d tienda_magic -c "\dt"
```

No debería mostrar nada aún (las tablas se crean después).

### 3.6 Ejecutar migraciones

Las migraciones son archivos que "dibujan" la estructura de tu base de datos.

```bash
php artisan migrate
```

Deberías ver:

```
Migrating: 2024_01_01_000001_create_users_table
Migrated: 2024_01_01_000001_create_users_table
...
```

Si ves errores, double-check tu `.env` (especialmente `DB_DATABASE`, `DB_USERNAME`, etc.).

### 3.7 (Opcional) Importar datos de cartas

Si quieres cargar las cartas reales desde Scryfall:

```bash
php artisan scryfall:import neo
```

Esto descarga miles de cartas. **Puede tardar 10-20 minutos.** Si no lo haces ahora, puedes hacerlo después.

---

## 🎨 Paso 4: Configurar el Proyecto - Frontend (React)

### 4.1 Instalar dependencias de JavaScript

```bash
npm install
```

Descarga todas las librerías de React, Tailwind, etc. **Puede tardar unos minutos.**

### 4.2 Compilar los assets

```bash
npm run build
```

Esto compila React, CSS, etc. para que funcione en el navegador.

---

## 🎮 Paso 5: Ejecutar el Proyecto

Abre **DOS terminales** en la carpeta `/tienda-magic`:

### Terminal 1: Servidor Laravel

```bash
php artisan serve
```

Deberías ver:

```
Laravel development server started: http://127.0.0.1:8000
```

**NO cierres esta terminal.** Déjala corriendo en segundo plano.

### Terminal 2: Frontend (Vite)

En la **otra terminal** (en la misma carpeta):

```bash
npm run dev
```

Deberías ver algo como:

```
  VITE v5.0.0  ready in 123 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

---

## 🌐 Acceder a la Aplicación

Abre tu navegador y ve a:

```
http://localhost:8000
```

O si Vite te dice usar `http://localhost:5173`, usa eso.

**¡Si ves la página de login, ¡el proyecto está funcionando!** 🎉

---

## 🆘 Solucionar Problemas Comunes

### "No such file or directory: 'composer.json'"

**Problema:** No estás en la carpeta correcta.

**Solución:**

```bash
cd ~/Proyectos/tienda-magic
ls composer.json  # Verifica que existe
```

### "PHP command not found"

**Problema:** PHP no está instalado o no está en el PATH.

**Solución (Mac):**

```bash
echo 'export PATH="/opt/homebrew/opt/php@8.2/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
php --version
```

### "Database refused connection"

**Problema:** PostgreSQL no está corriendo o las credenciales son incorrectas.

**Solución:**

1. Verifica que PostgreSQL está corriendo:

```bash
# Mac
brew services list | grep postgresql

# Linux
sudo systemctl status postgresql
```

2. Si no está corriendo, inicia:

```bash
# Mac
brew services start postgresql

# Linux
sudo systemctl start postgresql
```

3. Verifica tu `.env` (especialmente `DB_PASSWORD`):

```bash
grep DB_ .env
```

4. Verifica que la BD existe:

```bash
psql -U postgres -l | grep tienda_magic
```

Si no aparece, crea:

```bash
createdb tienda_magic
```

### "Port 8000 is already in use"

**Problema:** Otro programa usa el puerto 8000.

**Solución:** Usar otro puerto:

```bash
php artisan serve --port=8001
```

Luego accede a `http://localhost:8001`.

### "npm: command not found"

**Problema:** Node.js/npm no está instalado.

**Solución:**

Instala Node.js desde [nodejs.org](https://nodejs.org) o con Homebrew:

```bash
brew install node
npm --version
```

### "Module not found" en React

**Problema:** Las dependencias de npm no se instalaron correctamente.

**Solución:**

```bash
rm -rf node_modules package-lock.json
npm install
```

### "SQLSTATE[42P01]" (tabla no existe)

**Problema:** Las migraciones no se ejecutaron.

**Solución:**

```bash
php artisan migrate
```

---

## 🔄 Flujo Típico Diario

Una vez instalado todo, así es como trabaja típicamente:

```bash
# 1. Abre Terminal 1
cd ~/Proyectos/tienda-magic
php artisan serve

# 2. Abre Terminal 2
cd ~/Proyectos/tienda-magic
npm run dev

# 3. Accede a la app en el navegador
# http://localhost:8000

# ... Edita código, los cambios se recargan automáticamente ...

# 4. Cuando terminas, presiona Ctrl+C en ambas terminales
```

---

## 📚 Próximos Pasos

Ahora que el proyecto está corriendo:

1. **Explora la aplicación** - Crea usuarios, compra cartas, prueba el mercado
2. **Lee el README** - Entiende qué es cada funcionalidad
3. **Revisa el código** - Los archivos en `app/` (backend) y `resources/js` (frontend)
4. **Personaliza** - Cambia colores, texto, agrega features

---

## 🆘 ¿Todavía tienes problemas?

Si algo no funciona:

1. **Revisa los logs** - Ambos servidores muestran errores en la terminal
2. **Google el error** - Copia el mensaje exacto y busca
3. **Abre un issue** - En el repositorio de GitHub
4. **Pide ayuda** - En foros como Stack Overflow

---

## 🎓 Recursos Útiles

- [Documentación de Laravel](https://laravel.com/docs)
- [Documentación de React](https://react.dev)
- [Documentación de PostgreSQL](https://www.postgresql.org/docs/)
- [Documentación de Node.js](https://nodejs.org/docs/)

---

¡Disfruta desarrollando Tienda Magic! 🃏✨

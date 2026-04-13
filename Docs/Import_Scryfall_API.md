# 🛠️ Inicialización del Catálogo y Sobres

Este es el proceso obligatorio para inicializar el catálogo de Magic: The Gathering cuando la base de datos está vacía (por ejemplo, después de un `php artisan migrate:fresh`).

⚠️ **Importante:** El orden de ejecución es estricto. Las tablas están relacionadas; si intentas descargar las cartas sin haber creado primero las expansiones (sets), la base de datos lanzará errores de integridad referencial.

## 1. Sincronizar Catálogo de Cartas

```bash
php artisan scryfall:sync-master
```

Descarga el catálogo completo de cartas usando el Bulk Data de Scryfall y las asocia a sus respectivas expansiones.

⏱️ **Nota:** Este proceso maneja más de 100.000 registros. Puede tardar varios minutos, no cierres la terminal.

## 2. Sincronizar Expansiones (Sets)

```bash
php artisan scryfall:sync-sets
```

Realiza una petición a la API de Scryfall para descargar todas las expansiones disponibles. Esto crea los "contenedores" necesarios para el siguiente paso.

## 3. Generar Sobres para la Tienda

```bash
php artisan shop:generate-packs
```

Analiza las expansiones que ya tienen cartas en tu base de datos y genera dinámicamente los artículos para la tienda (Booster Packs), asignándoles precios e imágenes de portada automáticamente.

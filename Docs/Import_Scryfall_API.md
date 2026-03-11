## Como inicializar los datos (Para Evaluadores)

El proyecto cuenta con comandos Artisan personalizados para automatizar la descarga de la API de Scryfall y la generacion de la tienda.

### Metodo Recomendado (Automatico):
Ejecuta el siguiente comando para limpiar la base de datos, sincronizar los 12 sets premium de Scryfall (Modern Horizons, Ultimate Masters, etc.) y generar los sobres automaticamente:

```bash
php artisan shop:setup-demo
```

**Que hace este comando?**
- Limpia la base de datos (booster_pack, cards)
- Sincroniza todos los sets desde Scryfall
- Descarga 100 cartas de 12 sets premium
- Genera booster packs automaticamente

**Sets que se importan:**
- MH1, MH2, MH3 (Modern Horizons)
- UMA, 2XM, CMM (Ultimate Masters)
- NEO, ONE, BRO (Nuevas expansiones)
- WAR, MOM, LCI (Sets populares)

---

### Metodo Manual (Paso a paso):

Si prefieres controlar el proceso manualmente:

#### Paso 1: Sincronizar sets
```bash
php artisan scryfall:sync-sets
```

#### Paso 2: Importar cartas (12 sets principales)
```bash
# Modern Horizons (Mas populares)
php artisan scryfall:sync-cards --set=MH1 --limit=100
php artisan scryfall:sync-cards --set=MH2 --limit=100
php artisan scryfall:sync-cards --set=MH3 --limit=100

# Masters/Reimpresiones
php artisan scryfall:sync-cards --set=UMA --limit=100
php artisan scryfall:sync-cards --set=2XM --limit=100
php artisan scryfall:sync-cards --set=CMM --limit=100

# Sets Nuevos (2020-2023)
php artisan scryfall:sync-cards --set=NEO --limit=100
php artisan scryfall:sync-cards --set=ONE --limit=100
php artisan scryfall:sync-cards --set=BRO --limit=100

# Sets Clasicos Populares
php artisan scryfall:sync-cards --set=WAR --limit=100
php artisan scryfall:sync-cards --set=MOM --limit=100
php artisan scryfall:sync-cards --set=LCI --limit=100
```

#### Paso 3: Generar booster packs
```bash
php artisan shop:generate-packs
```

---

### Metodo con Seeders (Rapido):

Si solo necesitas los packs basicos sin descargar cartas:

```bash
php artisan db:seed --class=BoosterPackSeeder
```

**Sets incluidos:** MOM, BRO, ONE, DMU, WAR, MID, VOW, STX, KHM, IKO

---

## Comandos Utiles

### Verificar estado
```bash
# Ver sets importados
php artisan scryfall:sync-sets

# Verificar cartas de un set especifico
php artisan scryfall:sync-cards --set=MOM --limit=50
```

### Generar packs para un set especifico
```bash
php artisan shop:generate-packs MOM
```

---

## Notas Importantes

- **Tiempo estimado:** 5-10 minutos para importacion completa
- **Rate limiting:** Los comandos incluyen pausas automaticas
- **API Scryfall:** Gratis, pero con limites de 10-50 requests/segundo
- **Base de datos:** PostgreSQL recomendado para mejor rendimiento
- **Espacio requerido:** ~50-100MB para 1200 cartas + packs

---

## Recomendacion

Para evaluadores del proyecto, usa el comando automatizado:

```bash
php artisan shop:setup-demo
```

Esto asegurara que tengas todos los datos necesarios para probar la funcionalidad completa de la tienda de Magic.

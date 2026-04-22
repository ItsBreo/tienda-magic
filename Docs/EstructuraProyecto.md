# 📐 Estructura del Proyecto - Tienda Magic

Esta guía explora la arquitectura interna de Tienda Magic, cómo están organizadas las carpetas, los componentes, y cómo fluye la información entre frontend, backend, base de datos y la API de Scryfall.

## 🏗️ Vista General del Proyecto

Tienda Magic es un proyecto **Full-Stack** en una sola carpeta:

```
tienda-magic/
├── app/                    # Backend (Laravel/PHP)
├── resources/              # Frontend (React/JavaScript)
├── routes/                 # Rutas de la API
├── config/                 # Configuración de la aplicación
├── database/               # Migraciones y seeders
├── public/                 # Archivos públicos y estáticos compilados
├── storage/                # Logs, caché, archivos subidos
├── vendor/                 # Dependencias PHP (Composer)
├── node_modules/           # Dependencias JS (npm)
└── docker-compose.yaml     # Configuración de Docker
```

---

## 🔙 Backend - Carpeta `app/`

La carpeta `app/` contiene toda la lógica del servidor (Laravel).

### 📊 `app/Models/` - Modelos de Base de Datos

Los modelos representan las **tablas de la base de datos** y cómo se relacionan entre sí.

**Modelos principales:**

| Modelo | Propósito |
|--------|-----------|
| `User.php` | Usuario registrado (nombre, email, wallet) |
| `Card.php` | Carta individual (nombre, rareza, datos de Scryfall) |
| `CardSet.php` | Colección de cartas (ej: "Bloomburrow") |
| `BoosterPack.php` | Sobre cerrado sin abrir |
| `Inventory.php` | Inventario del usuario (cartas individuales) |
| `InventoryCard.php` | Cartas en poder del usuario |
| `InventoryPack.php` | Sobres sin abrir en poder del usuario |
| `Wallet.php` | Billetera de saldo digital del usuario |
| `WalletTransaction.php` | Historial de transacciones (auditoría) |
| `Market.php` | Listado de cartas a la venta en el mercado |
| `Order.php` | Compra realizada (tienda oficial) |
| `OrderItem.php` | Items dentro de una compra |
| `TradeSession.php` | Sesión de intercambio entre dos usuarios |
| `TradeItem.php` | Cartas en disputa en un intercambio |
| `Forum.php` | Categoría de foro |
| `Thread.php` | Hilo en un foro |
| `Comment.php` | Comentario en un hilo |
| `Achievement.php` | Logros desbloqueables |
| `UserAchievement.php` | Logros que tiene cada usuario |
| `CardPriceHistory.php` | Historial de precios (tendencias del mercado) |

**Ejemplo: Relación User → Inventory**

```php
// app/Models/User.php
public function inventory()
{
    return $this->hasOne(Inventory::class);
}

// app/Models/Inventory.php
public function user()
{
    return $this->belongsTo(User::class);
}
```

### 🎮 `app/Http/Controllers/` - Lógica de Negocio

Los controladores manejan las solicitudes del frontend y devuelven respuestas.

**Estructura de carpetas:**

```
Controllers/
├── Shop/                   # Tienda (comprar sobres)
│   ├── CartController.php           # Carrito de compras
│   ├── CatalogController.php        # Listado de sobres
│   ├── CheckoutController.php       # Pagar
│   ├── PackOpeningController.php    # Abrir sobre
│   └── PackDetailController.php     # Detalles de un sobre
├── Market/                 # Mercado P2P
│   ├── MarketController.php         # Venta de cartas entre usuarios
│   └── TransactionController.php    # Transacciones
├── Inventory/              # Inventario del usuario
│   ├── InventoryController.php      # Ver inventario
│   ├── DeckController.php           # Crear/editar mazos
│   └── WalletTransactionController.php  # Historial de saldo
├── Exchange/               # Sala de trueque
│   ├── ExchangeController.php       # Proponer intercambio
│   └── TradeController.php          # Aceptar/rechazar
├── Social/                 # Red social
│   ├── ForumController.php          # Categorías de foro
│   ├── ThreadController.php         # Hilos
│   ├── CommentController.php        # Comentarios
│   └── ProfileController.php        # Perfiles públicos
├── Card/                   # Cartas
│   ├── CardController.php           # Detalles de carta
│   ├── CardSetController.php        # Detalles de colección
│   └── PackController.php           # Packs disponibles
├── User/                   # Usuarios
│   ├── LoginController.php          # Autenticación
│   ├── RegisterController.php       # Registro
│   └── UserProfileController.php    # Perfil del usuario
├── Admin/                  # Panel de admin
│   ├── AdminUserController.php      # Gestión de usuarios
│   ├── AdminSetController.php       # Gestión de colecciones
│   └── AdminCardController.php      # Gestión de cartas
└── Api/                    # Endpoints especiales
    ├── SetController.php            # Datos de colecciones
    └── DashboardController.php      # Estadísticas

```

**Flujo típico de un controller:**

```php
// app/Http/Controllers/Shop/CartController.php
class CartController
{
    public function addToCart(Request $request)
    {
        // 1. Validar datos
        $validated = $request->validate([...]);
        
        // 2. Lógica de negocio (usando Models + Services)
        $user = auth()->user();
        $user->cart()->attach($pack);
        
        // 3. Retornar respuesta
        return response()->json(['message' => 'Added to cart']);
    }
}
```

### 🔧 `app/Services/` - Servicios Reutilizables

Los servicios contienen lógica que **se reutiliza en varios controladores**.

**Servicios principales:**

| Servicio | Propósito |
|----------|-----------|
| `PackService.php` | Generar configuración de sobre (qué cartas contiene) |
| `Scryfall/ScryfallService.php` | Comunicarse con la API de Scryfall |

**Ejemplo: PackService**

```php
// app/Services/PackService.php
public function generatePackConfig(CardSet $set): array
{
    // Standard: 10 commons, 3 uncommons, 1 rare, 1 foil = 15 cartas
    // Collector: 4 commons, 3 uncommons, 4 rares, 2 mythics, 2 foils = 15 cartas
    
    return [
        'commons' => 10,
        'uncommons' => 3,
        'rare' => 1,
        'total_cards' => 15
    ];
}
```

### 🌐 `routes/` - Mapeo de URLs a Controllers

Las rutas dirigen las solicitudes HTTP a los controladores correctos.

**Archivo: `routes/api.php`**

```php
// Rutas públicas (sin autenticación)
Route::post('/login', [LoginController::class, 'store']);
Route::post('/register', [RegisterController::class, 'store']);
Route::get('/shop', [CatalogController::class, 'index']);
Route::get('/cards/set/{setCode}', [CardController::class, 'getBySet']);

// Rutas protegidas (requieren login)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/cart/add', [CartController::class, 'addToCart']);
    Route::post('/market/sell', [MarketController::class, 'publish']);
    Route::post('/trade/propose', [TradeController::class, 'propose']);
});

// Rutas admin (solo administradores)
Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::post('/admin/sets', [AdminSetController::class, 'store']);
    Route::delete('/admin/users/{id}', [AdminUserController::class, 'destroy']);
});
```

---

## 🎨 Frontend - Carpeta `resources/js/`

La carpeta `resources/js/` contiene todo el código React (interfaz del usuario).

### 📁 Estructura Típica

```
resources/js/
├── components/             # Componentes reutilizables
│   ├── packs/                       # Componentes de sobres
│   ├── LoginForm.tsx                # Formulario de login
│   ├── Navbar.tsx                   # Barra de navegación
│   ├── Footer.tsx                   # Pie de página
│   └── ui/                          # Componentes base (Buttons, Cards, etc.)
├── pages/                  # Páginas completas
│   ├── welcome.tsx                  # Página de inicio
│   ├── auth/                        # Autenticación
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── shop/                        # Tienda
│   │   ├── catalog.tsx              # Catálogo de sobres
│   │   ├── checkout.tsx             # Carrito
│   │   └── pack-opening.tsx         # Abrir sobre
│   ├── inventory/                   # Inventario
│   │   ├── cards.tsx                # Mis cartas
│   │   ├── packs.tsx                # Mis sobres sin abrir
│   │   └── decks.tsx                # Mis mazos
│   ├── market/                      # Mercado P2P
│   │   ├── buy.tsx                  # Cartas a comprar
│   │   └── sell.tsx                 # Vender cartas
│   ├── exchange/                    # Intercambios
│   │   └── trade-room.tsx           # Sala de trueque
│   ├── social/                      # Red social
│   │   ├── forum.tsx                # Foros
│   │   └── profile.tsx              # Perfil público
│   └── admin/                       # Panel de admin
│       ├── users.tsx
│       ├── sets.tsx
│       └── cards.tsx
├── layouts/                # Layouts base
│   ├── app-layout.tsx               # Layout principal con sidebar
│   └── auth-layout.tsx              # Layout para login/register
├── services/               # Servicios (comunicación con el backend)
│   └── ApiService.ts                # Cliente HTTP
├── hooks/                  # Hooks personalizados
│   ├── useFetch.ts                  # Hacer peticiones HTTP
│   ├── useAuth.ts                   # Autenticación
│   └── useCart.ts                   # Carrito
├── contexts/               # Context API (estado global)
│   ├── AuthContext.tsx              # Estado de autenticación
│   └── CartContext.tsx              # Estado del carrito
├── types/                  # Tipos TypeScript
│   └── index.ts                     # Definiciones de tipos
└── app.tsx                 # Componente raíz
```

### 🧩 Componentes Clave

#### Componentes de Página

**Ejemplo: `pages/shop/catalog.tsx`**

```tsx
export default function CatalogPage() {
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 📡 Llamada al backend
    ApiService.get('/api/packs')
      .then(res => setPacks(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="grid gap-4">
      {packs.map(pack => (
        <PackCard key={pack.id} pack={pack} />
      ))}
    </div>
  );
}
```

#### Componentes Reutilizables

**Ejemplo: `components/packs/PackCard.tsx`**

```tsx
interface PackCardProps {
  pack: Pack;
  onAdd?: () => void;
}

export function PackCard({ pack, onAdd }: PackCardProps) {
  return (
    <div className="border rounded-lg p-4">
      <h3>{pack.name}</h3>
      <p>{pack.description}</p>
      <button onClick={onAdd}>Agregar al carrito</button>
    </div>
  );
}
```

#### Context (Estado Global)

**Ejemplo: `contexts/AuthContext.tsx`**

```tsx
// Almacena info del usuario autenticado
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay sesión activa
    ApiService.get('/api/me')
      .then(res => setUser(res.data))
      .catch(() => setUser(null));
  }, []);

  return { user, isLoading };
};
```

---

## 🔗 Flujo de Arquitectura

### Diagrama General

```
┌─────────────────────────────────────────────────────────────┐
│                      NAVEGADOR (USER)                       │
└──────────────────────────────────┬──────────────────────────┘
                                   │
                   ┌───────────────┴───────────────┐
                   │                               │
            ┌──────▼────────┐           ┌─────────▼────────┐
            │  REACT FRONT  │           │  STATIC FILES    │
            │ (SPA Web App) │           │ (CSS, JS, etc.)  │
            └──────┬────────┘           └──────────────────┘
                   │
          HTTP RESTful API
             (JSON over HTTP)
                   │
   ┌───────────────┴────────────────────┐
   │                                    │
   ▼                                    ▼
┌──────────────────────────┐  ┌──────────────────┐
│   LARAVEL (Backend)      │  │  SCRYFALL API    │
│   ┌────────────────────┐ │  │  (Datos Reales)  │
│   │ Controllers        │ │  │                  │
│   │ Services           │ │  │ - Card Data      │
│   │ Models (Eloquent)  │ │  │ - Precios        │
│   │ Validation Rules   │ │  │ - Sets           │
│   └────────────────────┘ │  │ - Images         │
└──────────────┬───────────┘  └────────┬─────────┘
               │                       │
               └───┬─────────────────┬─┘
                   │                 │
                   ▼                 ▼
            ┌─────────────────────────────┐
            │    PostgreSQL DATABASE      │
            │  ┌───────────────────────┐  │
            │  │ 28 Tablas             │  │
            │  │ - users               │  │
            │  │ - cards               │  │
            │  │ - inventories         │  │
            │  │ - orders              │  │
            │  │ - market              │  │
            │  │ - wallets             │  │
            │  │ - etc...              │  │
            │  └───────────────────────┘  │
            └─────────────────────────────┘
```

---

## 🔄 Flujo de un Caso de Uso: Comprar un Sobre

### Paso 1: Usuario ve el catálogo de sobres

```
┌─ React (Frontend)
│  └─ Component: CatalogPage
│     └─ useEffect → ApiService.get('/api/shop')
│        └─ 📡 HTTP Request
│
└─ Laravel (Backend)
   └─ Route: GET /api/shop
      └─ CatalogController@index
         └─ Retorna lista de packs en JSON
         
💾 Base de Datos: SELECT * FROM booster_packs;
```

### Paso 2: Usuario añade sobre al carrito

```
┌─ React (Frontend)
│  └─ Component: PackCard
│     └─ Button "Agregar al carrito"
│        └─ onClick → handleAddToCart()
│           └─ 📡 HTTP POST /api/cart/add
│
└─ Laravel (Backend)
   └─ Route: POST /api/cart/add
      └─ CartController@add (Requiere auth:sanctum)
         └─ Valida: ¿Existe el pack?
         └─ Acción: $user->cart()->attach($pack)
         └─ Retorna: JSON {'message': 'Added to cart'}
         
💾 Base de Datos: INSERT INTO carts VALUES (...);
```

### Paso 3: Usuario realiza checkout (paga)

```
┌─ React (Frontend)
│  └─ Component: CheckoutPage
│     └─ Button "Comprar"
│        └─ 📡 HTTP POST /api/checkout
│
└─ Laravel (Backend)
   └─ Route: POST /api/checkout
      └─ CheckoutController@process
         └─ Acciones:
            1. Validar saldo: $user->wallet->balance >= total?
            2. Deducir saldo: $user->wallet->deductBalance($total)
            3. Crear orden: Order::create([...])
            4. Mover items a inventario: $user->inventory->attach($packs)
            5. Registrar transacción: WalletTransaction::create([...])
         └─ Retorna: JSON {'order_id': 123}
         
💾 Base de Datos:
   - UPDATE wallets SET balance = balance - X
   - INSERT INTO orders VALUES (...)
   - INSERT INTO cart_items INTO inventory_packs
   - INSERT INTO wallet_transactions
```

### Paso 4: Usuario abre el sobre

```
┌─ React (Frontend)
│  └─ Component: PackOpeningPage
│     └─ Button "Abrir Sobre"
│        └─ 📡 HTTP POST /api/packs/{id}/open
│
└─ Laravel (Backend)
   └─ Route: POST /api/packs/{id}/open
      └─ PackOpeningController@open
         └─ Acciones:
            1. Obtener config del pack: $packService->getConfig($pack)
            2. Generar 15 cartas aleatorias según config
            3. Crear InventoryCards
            4. Eliminar InventoryPack
         └─ Retorna: JSON { cards: [...] }
         
💾 Base de Datos:
   - INSERT INTO inventory_cards VALUES (...) × 15
   - DELETE FROM inventory_packs WHERE id = X

📊 Scryfall API (quizá):
   Si falta info de una carta:
   - GET https://api.scryfall.com/cards/{id}
   - Cachear el resultado
```

---

## 📡 API REST Endpoints Principales

### Autenticación

```http
POST /api/login
POST /api/register
GET /api/me (Requiere token)
POST /api/logout (Requiere token)
```

### Tienda

```http
GET /api/shop              # Catálogo de sobres
GET /api/packs             # Todos los packs
GET /api/pack/{code}       # Detalles de un pack
POST /api/cart/add         # Añadir al carrito
POST /api/checkout         # Comprar
POST /api/packs/{id}/open  # Abrir sobre
```

### Inventario

```http
GET /api/inventory         # Mi inventario
GET /api/inventory/cards   # Mis cartas
GET /api/inventory/packs   # Mis sobres
GET /api/wallet            # Mi saldo
GET /api/wallet/transactions  # Historial de transacciones
```

### Mercado

```http
GET /api/market            # Cartas a la venta
POST /api/market/sell      # Vender carta
POST /api/market/buy/{id}  # Comprar carta
```

### Intercambios

```http
POST /api/trade/propose    # Proponer intercambio
PUT /api/trade/{id}/accept # Aceptar intercambio
PUT /api/trade/{id}/reject # Rechazar intercambio
```

### Social

```http
GET /api/forum             # Categorías
GET /api/forum/{id}/threads  # Hilos en categoría
POST /api/threads          # Crear hilo
POST /api/comments         # Comentar
GET /api/profile/{userId}  # Perfil público
```

---

## 🔐 Autenticación & Flujo de Tokens

Tienda Magic usa **Laravel Sanctum** para autenticación basada en tokens:

```
1. Usuario hace POST /api/login con email + password
   └─ Si correcto: Backend genera TOKEN (formato: 1|hash...)
   
2. Frontend guarda token en localStorage
   └─ Token se envía en header: Authorization: Bearer TOKEN
   
3. Cada solicitud autenticada valida el token
   └─ Si es válido: Procesa la solicitud
   └─ Si es inválido: Retorna 401 Unauthorized
   
4. Logout: Frontend elimina el token y backend revoca el acceso
```

---

## 💾 Base de Datos - 28 Tablas

### Grupos principales:

| Grupo | Tablas | Propósito |
|-------|--------|-----------|
| **Usuarios** | users, user_profiles, user_achievements | Gestión de usuarios y perfil |
| **Cartas** | cards, card_sets, card_price_history | Datos de cartas (sincronizadas con Scryfall) |
| **Tienda** | booster_packs, orders, order_items, carts | Compra de sobres |
| **Inventario** | inventories, inventory_cards, inventory_packs, inventory_decks | Posesión de cartas y mazos |
| **Economía** | wallets, wallet_transactions | Gestión de saldo y auditoría |
| **Mercado** | markets | Cartas en venta P2P |
| **Intercambios** | trade_sessions, trade_items | Trueque entre usuarios |
| **Social** | forums, threads, comments, chats | Red social |
| **Sistema** | achievements, cookies, roles, searchers, exchanges | Gamificación y extras |

---

## 🌐 Integración con Scryfall API

**¿Qué es Scryfall?**

Scryfall es una **base de datos pública de Magic: The Gathering** que proporciona datos reales de cartas, sets, precios, etc.

### Flujo de sincronización:

```
1. Admin ejecuta: php artisan scryfall:import neo
   └─ Laravel conecta a Scryfall API
   └─ Descarga todas las cartas del set "neo" (Bloomburrow)
   
2. Para cada carta, StryFall proporciona:
   - name, colors, rarity, mana_value
   - tipo, texto, imágenes
   - precios históricos
   
3. Laravel inserta en DB:
   - INSERT INTO cards VALUES (name, colors, ...)
   - UPDATE card_price_history WITH prices
   
4. Frontend muestra datos cacheados:
   - Si necesita info de una carta → GET /api/cards/{id}
   - Si falta→ axios → GET https://api.scryfall.com/cards/{id}
```

**Endpoints de Scryfall usados:**

```
GET https://api.scryfall.com/sets           # Todos los sets
GET https://api.scryfall.com/cards/search?q=SET:{code}  # Cartas de un set
GET https://api.scryfall.com/cards/{id}    # Detalles de una carta
```

---

## 🚀 Flujo de Desarrollo

### Para agregar una nueva feature (ej: Historial de precios en gráfica)

```
1. Backend (PHP)
   └─ Crear Migration: php artisan make:migration create_chart_table
   └─ Crear Model: app/Models/ChartData.php
   └─ Crear Controller: app/Http/Controllers/ChartController.php
   └─ Crear ruta: Route::get('/api/chart', ChartController@data)

2. Base de Datos (PostgreSQL)
   └─ Ejecutar: php artisan migrate
   └─ Verificar: psql -d tienda_magic -c "\dt"

3. Frontend (React)
   └─ Crear página: resources/js/pages/analytics/chart.tsx
   └─ Crear componente: resources/js/components/chart.tsx
   └─ En useEffect → ApiService.get('/api/chart')
   └─ Renderizar con librería de gráficas (recharts, chart.js, etc.)

4. Test
   └─ npm run dev → Ver cambios en React
   └─ Backend valida en http://localhost:8000/api/chart
```

---

## 📝 Resumen: Capas de Arquitectura

```
┌─────────────┬──────────────────────────────────────────┐
│   CAPA      │         COMPONENTES                      │
├─────────────┼──────────────────────────────────────────┤
│ Presentación│ React Components, Pages, Layouts         │
│ (Frontend)  │ CSS, Tailwind, TypeScript                │
├─────────────┼──────────────────────────────────────────┤
│ API REST    │ HTTP Endpoints, JSON serialization       │
│ (Interfaz)  │ Status codes, error handling             │
├─────────────┼──────────────────────────────────────────┤
│ Lógica Negoc│ Controllers, Services, Validation        │
│ (Backend)   │ PHP, Laravel framework                   │
├─────────────┼──────────────────────────────────────────┤
│ Persistencia│ Models (Eloquent ORM), Migrations        │
│ (BD)        │ PostgreSQL, Relaciones, Índices          │
├─────────────┼──────────────────────────────────────────┤
│ Fuentes Ext │ Scryfall API, Stripe (simulado)          │
│ (APIs)      │ HTTP requests, data caching              │
└─────────────┴──────────────────────────────────────────┘
```

---

## 🎯 Conceptos Clave

### SPA (Single Page Application)

- React es una **SPA**: La página no se recarga, solo se actualizan secciones
- Comunicación con backend vía **AJAX/Fetch/Axios**
- Más rápido que recargar la página completa

### ORM (Object-Relational Mapping)

- **Eloquent** (Laravel) mapea tablas de BD a objetos PHP
- `User::find(1)` → SELECT * FROM users WHERE id = 1

### RESTful API

- **REST** = Representational State Transfer
- Usa métodos HTTP: GET (leer), POST (crear), PUT (actualizar), DELETE (eliminar)
- Retorna JSON (formato de datos legible)

### Caché

- Scryfall API es lenta, así que se **cachea** la respuesta
- Próximas veces, sirve el caché sin consultar nuevamente

---

## 🔧 Herramientas de Desarrollo Útiles

```bash
# Backend
php artisan tinker              # Consola interactiva
php artisan migrate             # Ejecutar migraciones
php artisan db:seed             # Rellenar BD con datos de prueba
php artisan route:list          # Ver todas las rutas

# Frontend
npm run dev                      # Servidor de desarrollo con hot-reload
npm run build                    # Compilar para producción
npm run lint                     # Verificar errores de código

# Base de Datos
psql -d tienda_magic            # Acceder a PostgreSQL
\dt                             # Listar tablas
SELECT * FROM users;            # Ver usuarios
```

---

¡Ahora entiendes la arquitectura de Tienda Magic! 🎉 Cualquier pregunta sobre cómo agregar features o modificar funcionalidad, consulta esta guía. 🚀

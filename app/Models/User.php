<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail; // Descomenta si quieres verificar email
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
// HasApiTokens eliminado (era de Laravel\Sanctum, incompatible con JWT)
use Laravel\Fortify\TwoFactorAuthenticatable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Tymon\JWTAuth\Contracts\JWTSubject;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Casts\Attribute;

/**
 * Modelo de Usuario del sistema.
 *
 * Representa a los usuarios con autenticación Sanctum, wallet y relaciones
 * con inventario, pedidos, decks y perfil extendido.
 */
class User extends Authenticatable implements JWTSubject
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable, SoftDeletes;
    // HasApiTokens eliminado: era de Sanctum y genera conflicto con el JWTGuard

    /**
     * Relaciones cargadas automáticamente para evitar el problema de N+1 queries 
     * al serializar colecciones o listar usuarios.
     */
    protected $with = ['roles', 'profile'];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'wallet_balance',
    ];

    /**
     * Roles del sistema (en orden jerárquico de mayor a menor).
     * super_admin > admin > mod_* > user
     */
    public const ROLE_SUPER_ADMIN    = 'super_admin';
    public const ROLE_ADMIN          = 'admin';
    public const ROLE_MOD_NEWS       = 'mod_news';
    public const ROLE_MOD_TOURNAMENTS= 'mod_tournaments';
    public const ROLE_MOD_GENERAL    = 'mod_general';
    public const ROLE_MOD_STRATEGY   = 'mod_strategy';
    public const ROLE_USER           = 'user';

    /** Slugs que se consideran moderadores sectoriales */
    public const MOD_ROLES = [
        self::ROLE_MOD_NEWS,
        self::ROLE_MOD_TOURNAMENTS,
        self::ROLE_MOD_GENERAL,
        self::ROLE_MOD_STRATEGY,
    ];

    /** Slugs con privilegios de administración del foro */
    public const ADMIN_ROLES = [
        self::ROLE_ADMIN,
        self::ROLE_SUPER_ADMIN,
    ];

    /**
     * Atributos dinámicos que siempre se adjuntarán al array/JSON del modelo
     */
    protected $appends = [
        'is_admin',
        'role_name',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'wallet_balance' => 'float',
        ];
    }

    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($user) {
            // Si es un Soft Delete (ban/suspensión), NO borramos los datos definitivamente
            if (!$user->isForceDeleting()) {
                return;
            }

            // Eliminar relaciones usando DB::table para saltar restricciones de nombres de tabla/columnas
            $id = $user->id;

            \Illuminate\Support\Facades\DB::transaction(function () use ($id) {
                // Función auxiliar para borrar e ignorar errores si la tabla no existe
                $deleteIgnoreError = function ($table, $column = 'user_id', $additionalWhere = null) use ($id) {
                    try {
                        $query = \Illuminate\Support\Facades\DB::table($table)->where($column, $id);
                        if ($additionalWhere) {
                            $additionalWhere($query);
                        }
                        $query->delete();
                    } catch (\Exception $e) {
                        // Ignoramos el error, típicamente de "Base table or view not found"
                    }
                };

                // Tablas pivot o secundarias
                $deleteIgnoreError('user_role');
                $deleteIgnoreError('card_user');
                $deleteIgnoreError('user_achievement');

                // Tablas donde el usuario es autor
                $deleteIgnoreError('threads');
                $deleteIgnoreError('comments');

                // Tienda/Economía
                $deleteIgnoreError('carts');

                $deleteIgnoreError('orders', 'buyer_id', function ($query) use ($id) {
                    $query->orWhere('seller_id', $id);
                });

                $deleteIgnoreError('wallet_transaction');

                // Inventario/Mazos
                $deleteIgnoreError('deck');
                $deleteIgnoreError('inventory_card');
                $deleteIgnoreError('inventory_pack');

                // Perfil (con chequeo de columna por si acaso, dado el error anterior)
                try {
                    if (\Illuminate\Support\Facades\Schema::hasTable('profile') && \Illuminate\Support\Facades\Schema::hasColumn('profile', 'user_id')) {
                        \Illuminate\Support\Facades\DB::table('profile')->where('user_id', $id)->delete();
                    }
                } catch (\Exception $e) {
                }
            });
        });
    }

    // Relaciones con tablas
    // Todos los JOIN que tiene la tabla usuario

    // Usuario - perfil 1-1
    public function profile()
    {
        return $this->hasOne(UserProfile::class);
    }

    // Usuario - roles M:M (con forum_id en el pivot para moderadores sectoriales)
    public function roles()
    {
        return $this->belongsToMany(Role::class, 'user_role', 'user_id', 'roles_id')
                    ->withPivot('forum_id')
                    ->withTimestamps();
    }

    // Usuario - mazo 1:M
    public function decks()
    {
        return $this->hasMany(Deck::class);
    }

    // Relación 1:M con sus cartas
    public function inventoryCards()
    {
        return $this->hasMany(InventoryCard::class);
    }

    // Relación 1:M con sus sobres cerrados
    public function inventoryPacks()
    {
        return $this->hasMany(InventoryPack::class);
    }

    public function favoriteCards()
    {
        // Laravel buscará la tabla card_user automáticamente
        return $this->belongsToMany(Card::class);
    }

    public function itemsForSale()
    {
        return $this->hasMany(InventoryCard::class)->where('is_for_sale', true);
    }

    // Relación filtrada para lo que vende
    public function cardsForSale()
    {
        return $this->hasMany(Card::class)->where('is_for_sale', true);
    }

    public function decksForSale()
    {
        return $this->hasMany(Deck::class)->where('is_for_sale', true);
    }

    // User.php

    // Relación 1:M (Un usuario tiene muchos movimientos de dinero)
    public function transactions()
    {
        // Asumiendo que crearás un modelo WalletTransaction
        return $this->hasMany(WalletTransaction::class)->latest();
    }

    // Pedidos que ESTE usuario ha COMPRADO
    public function orders()
    {
        return $this->hasMany(Order::class, 'user_id');
    }

    // Pedidos que ESTE usuario ha VENDIDO (a otros)
    public function sales()
    {
        return $this->hasMany(Order::class, 'seller_id'); // Clave foránea explícita
    }

    // Relación M:M con logros
    public function achievements()
    {
        return $this->belongsToMany(Achievement::class, 'user_achievement')
        ->withPivot('obtained_at');
    }

    // =========================================================================
    // HELPERS DE ROL
    // =========================================================================

    /**
     * Comprueba si el usuario tiene un rol concreto (por slug, case-insensitive).
     */
    public function hasRole(string $role): bool
    {
        return $this->roles->contains(
            fn($r) => strtolower($r->name) === strtolower($role)
        );
    }

    /**
     * Es super_admin (control total de tienda + foro).
     */
    public function isSuperAdmin(): bool
    {
        return $this->hasRole(self::ROLE_SUPER_ADMIN);
    }

    /**
     * Es admin o superior (admin + super_admin).
     * Compatibilidad con el AdminMiddleware y el frontend.
     */
    public function isAdmin(): bool
    {
        return $this->hasRole(self::ROLE_ADMIN) || $this->isSuperAdmin();
    }

    /**
     * Es moderador sectorial (cualquier mod_*, sin ser admin).
     */
    public function isModerator(): bool
    {
        return $this->roles->contains(
            fn($r) => in_array(strtolower($r->name), self::MOD_ROLES)
        );
    }

    /**
     * Es moderador con acceso a un foro concreto.
     * Un admin/super_admin también puede moderar cualquier foro.
     */
    public function isModeratorOf(int $forumId): bool
    {
        if ($this->isAdmin()) {
            return true;
        }

        return $this->roles->contains(function ($role) use ($forumId) {
            return in_array(strtolower($role->name), self::MOD_ROLES)
                && (int) $role->pivot->forum_id === $forumId;
        });
    }

    /**
     * Nivel numérico del rol más alto del usuario (útil para comparaciones).
     */
    public function roleLevel(): int
    {
        if ($this->isSuperAdmin()) return 4;
        if ($this->isAdmin())      return 3;
        if ($this->isModerator())  return 2;
        return 1;
    }

    /**
     * Nombre del rol principal (el de mayor jerarquía) para el frontend.
     */
    public function getRoleNameAttribute(): string
    {
        if ($this->isSuperAdmin()) return self::ROLE_SUPER_ADMIN;
        if ($this->isAdmin())      return self::ROLE_ADMIN;

        $modRole = $this->roles->first(
            fn($r) => in_array(strtolower($r->name), self::MOD_ROLES)
        );
        if ($modRole) return strtolower($modRole->name);

        return self::ROLE_USER;
    }

    /**
     * Mutator para que el frontend reciba "is_admin" como un boolean.
     */
    public function getIsAdminAttribute(): bool
    {
        return $this->isAdmin();
    }

    /**
     * FÓRMULA DE REPUTACIÓN SOCIAL (Karma) base 100
     * Ahora lee la variable `$this->profile->reputation_score` la cual se suma incrementalmente
     * cada vez que este usuario recibe un voto (evitando calcular todo al vuelo mediante N+1 queries).
     */
    protected function reputation(): Attribute
    {
        return Attribute::make(
            get: function () {
                $baseScore = $this->profile->reputation_score ?? 0;
                
                // Asegurarse de que created_at no sea nulo al registrar
                $daysActive = max($this->created_at ? $this->created_at->diffInDays(now()) : 0, 0);
                $stabilityFactor = sqrt($daysActive);

                $formula = 100 + $baseScore + $stabilityFactor;
                
                return (int) round($formula);
            }
        );
    }

    /**
     * Get the identifier that will be stored in the subject claim of the JWT.
     *
     * @return mixed
     */
    // Relación M:M con trades enviados
    public function sentTrades()
    {
        return $this->hasMany(Trade::class, 'sender_id');
    }

    // Relación M:M con trades recibidos
    public function receivedTrades()
    {
        return $this->hasMany(Trade::class, 'receiver_id');
    }

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    /**
     * Return a key value array, containing any custom claims to be added to the JWT.
     *
     * @return array
     */
    public function getJWTCustomClaims()
    {
        return [];
    }

    // Threads creados por el usuario
public function threads(): HasMany
{
    return $this->hasMany(Thread::class);
}

// Comentarios del usuario
public function comments(): HasMany
{
    return $this->hasMany(Comment::class);
}

// Votos emitidos por el usuario
public function votes(): HasMany
{
    return $this->hasMany(Vote::class);
}

// Threads guardados por el usuario
public function savedThreads(): BelongsToMany
{
    return $this->belongsToMany(Thread::class, 'saved_threads')->withTimestamps();
}

public function createdTournaments()
{
    return $this->hasMany(Tournament::class, 'created_by');
}

public function tournamentRegistrations()
{
    return $this->hasMany(TournamentRegistration::class);
}

public function tournaments()
{
    return $this->belongsToMany(Tournament::class, 'tournament_registrations')
                ->withPivot('status', 'registered_at', 'confirmed_at')
                ->withTimestamps();
}

}

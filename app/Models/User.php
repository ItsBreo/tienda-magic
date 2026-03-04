<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail; // Descomenta si quieres verificar email
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Illuminate\Database\Eloquent\SoftDeletes;
// use Tymon\JWTAuth\Contracts\JWTSubject; // Descomentado temporalmente

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens, TwoFactorAuthenticatable;

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
     * Atributos dinámicos que siempre se adjuntarán al array/JSON del modelo
     */
    protected $appends = [
        'is_admin'
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
            'wallet_balance' => 'decimal:2',
        ];
    }

    // Relaciones con tablas
    // Todos los JOIN que tiene la tabla usuario

    // Usuario - perfil 1-1
    public function profile()
    {
        return $this->hasOne(UserProfile::class);
    }

    // Usuario - roles M:M
    public function roles()
    {
        return $this->belongsToMany(Role::class, 'user_role', 'user_id', 'roles_id');
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
        // Esto trae los registros del inventario que pertenecen al usuario
        // pero solo aquellos donde 'is_for_sale' sea verdadero (true/1)
        return $this->hasMany(Inventory::class)->where('is_for_sale', true);
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
    public function purchases()
    {
        return $this->hasMany(Order::class, 'buyer_id'); // Clave foránea explícita
    }

    // Pedidos que ESTE usuario ha VENDIDO (a otros)
    public function sales()
    {
        return $this->hasMany(Order::class, 'seller_id'); // Clave foránea explícita
    }

    // Relación M:M con logros
    public function achievements()
    {
        return $this->belongsToMany(Achievement::class);
    }

    public function isAdmin(): bool
    {
        // Verifica si alguno de sus roles se llama 'admin' (case-insensitive)
        return $this->roles->contains(function ($role) {
            return strtolower($role->name) === 'admin';
        });
    }

    /**
     * Mutator para que el frontend reciba "is_admin" como un boolean
     */
    public function getIsAdminAttribute(): bool
    {
        return $this->isAdmin();
    }

    /**
     * Get the identifier that will be stored in the subject claim of the JWT.
     *
     * @return mixed
     */
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
}

<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail; // Descomenta si quieres verificar email
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'wallet_balance',
        'username',
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
    public function profile() {
        return $this->hasOne(userProfile::class);
    }

    // Usuario - roles M:M
    public function roles(){
        return $this->belongsToMany(Role::class);
    }

    // Usuario - mazo 1:M
    public function decks(){
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

    public function favoriteCards(){
    // Laravel buscará la tabla card_user automáticamente
    return $this->belongsToMany(Card::class);
    }

    public function itemsForSale(){
    // Esto trae los registros del inventario que pertenecen al usuario
    // pero solo aquellos donde 'is_for_sale' sea verdadero (true/1)
    return $this->hasMany(Inventory::class)->where('is_for_sale', true);
    }

    // Relación filtrada para lo que vende
    public function cardsForSale() {
    return $this->hasMany(Card::class)->where('is_for_sale', true);
    }

    public function decksForSale() {
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

    public function isAdmin(): bool
    {
        // Verifica si alguno de sus roles se llama 'admin'
        return $this->roles->contains('name', 'admin');
    }
}

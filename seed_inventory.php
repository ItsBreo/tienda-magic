<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Card;
use App\Models\BoosterPack;
use App\Models\InventoryCard;
use App\Models\InventoryPack;

$user = User::where('email', 'admin@ejemplo.com')->first();
if (!$user) {
    echo "Admin user not found, trying Super Admin...\n";
    $user = User::where('username', 'superadmin')->first();
}

if ($user) {
    echo "Seeding inventory for user: {$user->username} (ID: {$user->id})\n";
    
    $cards = Card::limit(20)->get();
    foreach ($cards as $c) {
        InventoryCard::updateOrCreate(
            ['user_id' => $user->id, 'card_id' => $c->id],
            ['quantity' => 5, 'condition' => 'NM', 'language' => 'EN', 'is_foil' => false]
        );
    }
    
    $packs = BoosterPack::limit(10)->get();
    foreach ($packs as $p) {
        InventoryPack::updateOrCreate(
            ['user_id' => $user->id, 'booster_pack_id' => $p->id],
            ['quantity' => 3]
        );
    }
    
    echo "✅ Inventory seeded successfully!\n";
} else {
    echo "❌ No suitable user found for seeding.\n";
}

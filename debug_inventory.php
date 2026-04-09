<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\InventoryCard;
use App\Models\InventoryPack;
use App\Models\User;
use App\Models\Order;

$user = User::find(20);
if (!$user) {
    echo "User 20 not found, trying the first one...\n";
    $user = User::first();
}

echo "User: {$user->name} (ID: {$user->id})\n";

echo "\nTotal Orders in System: " . Order::count() . "\n";
echo "Recent Orders:\n";
foreach (Order::latest()->take(10)->get() as $o) {
    echo "- Order #{$o->id}, User: {$o->user_id}, Total: {$o->total_amount}, Status: {$o->status}\n";
}

echo "\nInventory Cards: " . InventoryCard::where('user_id', $user->id)->count() . "\n";
foreach (InventoryCard::where('user_id', $user->id)->with('card')->get() as $ic) {
    echo "- Card: " . ($ic->card->name ?? 'NULL') . " (ID: {$ic->card_id}), Qty: {$ic->quantity}\n";
}

echo "\nInventory Packs: " . InventoryPack::where('user_id', $user->id)->count() . "\n";
foreach (InventoryPack::where('user_id', $user->id)->with('boosterPack')->get() as $ip) {
    echo "- Pack: " . ($ip->boosterPack->name ?? 'NULL') . " (ID: {$ip->booster_pack_id}), Qty: {$ip->quantity}\n";
}

<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$session = App\Models\TradeSession::with('exchangeRequest.exchange')->find(7);
if (!$session) {
    echo "Trade Session 7 not found.\n";
    exit;
}
echo "Session:\n" . json_encode($session, JSON_PRETTY_PRINT) . "\n\n";

$req = $session->exchangeRequest;
$exchange = $req->exchange;

echo "Exchange card ID: " . $exchange->offered_inventory_card_id . "\n";
echo "Req card ID: " . $req->offered_inventory_card_id . "\n";

$card1 = App\Models\InventoryCard::find($exchange->offered_inventory_card_id);
if (!$card1) echo "Card 1 NOT FOUND\n";
else echo "Card 1 found, quantity: {$card1->quantity}\n";

$card2 = App\Models\InventoryCard::find($req->offered_inventory_card_id);
if (!$card2) echo "Card 2 NOT FOUND\n";
else echo "Card 2 found, quantity: {$card2->quantity}\n";

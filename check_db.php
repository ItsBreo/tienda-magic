<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "EXCHANGES (Listings):\n";
echo App\Models\Exchange::count() . " items.\n";

echo "EXCHANGE REQUESTS (Offers):\n";
echo App\Models\ExchangeRequest::count() . " items.\n";

echo "TRADE SESSIONS (Rooms):\n";
echo App\Models\TradeSession::count() . " items.\n";

echo "\nLatest Exchange:\n";
echo json_encode(App\Models\Exchange::latest()->first(), JSON_PRETTY_PRINT) . "\n";

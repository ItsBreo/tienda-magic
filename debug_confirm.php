<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

auth()->login(\App\Models\User::find(20)); // The one simulating confirm.

$controller = new \App\Http\Controllers\Exchange\TradeController();
$request = \Illuminate\Http\Request::create('/api/trade-sessions/7/confirm', 'POST');
$response = $controller->confirmTrade($request, 7);

echo "Status: " . $response->getStatusCode() . "\n";
echo "Content: " . $response->getContent() . "\n";

<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

auth()->login(\App\Models\User::find(20));

$controller = new \App\Http\Controllers\Exchange\TradeController();
$request = \Illuminate\Http\Request::create('/api/trade-sessions/7/confirm', 'POST');

try {
    $response = $controller->confirmTrade($request, 7);
} catch (\Throwable $e) {
    echo $e->getTraceAsString();
}

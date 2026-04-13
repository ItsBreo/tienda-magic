<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

auth()->login(\App\Models\User::find(20)); // Simulating user2 

$controller = new \App\Http\Controllers\Exchange\TradeController();

try {
    $response = $controller->confirmTrade(7); // Properly passing just the ID
    echo "Status: " . $response->getStatusCode() . "\n";
    echo "Content: " . $response->getContent() . "\n";
} catch (\Throwable $e) {
    echo "Exception: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}

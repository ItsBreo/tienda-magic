<?php
namespace Tests;
use App\Models\User;
require 'vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = User::first();
if (!$user) {
    echo "No user found\n";
    exit;
}

$request = \Illuminate\Http\Request::create('/api/wallet/recharge', 'POST', ['amount' => 5]);
$request->setUserResolver(function() use ($user) { return $user; });

// Simulate auth
$controller = new \App\Http\Controllers\Api\WalletController();
$response = $controller->createRechargeSession($request);
echo "Status: " . $response->getStatusCode() . "\n";
echo "Content: " . $response->getContent() . "\n";


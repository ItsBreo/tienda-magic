<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;

$user = User::where('email', '!=', 'admin@ejemplo.com')
            ->where('email', '!=', 'superadmin@tienda.com') // Por si acaso
            ->first();

if ($user) {
    $user->increment('wallet_balance', 100);
    echo "EMAIL: " . $user->email . "\n";
    echo "USER: " . $user->username . "\n";
} else {
    echo "No other user found.\n";
}

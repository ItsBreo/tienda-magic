<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;

$user = User::first();
if (!$user) {
    echo "No user found\n";
    exit;
}

echo "Testing soft delete for user: {$user->email} (ID: {$user->id})\n";
$user->delete();
echo "User deleted (soft). trashed(): " . ($user->trashed() ? 'YES' : 'NO') . "\n";

$found = User::find($user->id);
echo "User::find({$user->id}) returns: " . ($found ? 'User object' : 'NULL') . "\n";

$foundWithTrashed = User::withTrashed()->find($user->id);
echo "User::withTrashed()->find({$user->id}) returns: " . ($foundWithTrashed ? 'User object' : 'NULL') . "\n";

$user->restore();
echo "User restored.\n";

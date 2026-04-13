<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "EXCHANGES (Listings):\n";
echo App\Models\Exchange::count() . " items.\n";

echo "TRADE SESSIONS (Rooms) by status:\n";
print_r(Illuminate\Support\Facades\DB::table('trade_sessions')->select('status', \Illuminate\Support\Facades\DB::raw('count(*) as total'))->groupBy('status')->get()->toArray());

echo "\nFiles in storage/app/trade_logs:\n";
$files = \Illuminate\Support\Facades\Storage::disk('local')->files('trade_logs');
print_r($files);

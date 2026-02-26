<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\BoosterPack;

class CheckBoosterPacks extends Command
{
    protected $signature = 'check:booster-packs';
    protected $description = 'Check created booster packs';

    public function handle()
    {
        $this->info('Checking Booster Packs...');
        
        $count = BoosterPack::count();
        $this->line("Total booster packs created: {$count}");
        
        $this->line("\n=== SAMPLE PACKS ===");
        $packs = BoosterPack::take(5)->get();
        
        foreach ($packs as $pack) {
            $this->line("{$pack->name} - {$pack->type} - €{$pack->price}");
        }
        
        return 0;
    }
}

<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\CardSet;
use App\Models\BoosterPack;
use Exception;

class GenerateBoosterPacks extends Command
{
    protected $signature = 'shop:generate-packs {--force : Force regeneration of existing packs}';
    protected $description = 'Generate booster packs based on existing card sets with dynamic pricing';

    private int $totalProcessed = 0;
    private int $totalCreated = 0;
    private int $totalUpdated = 0;

    public function handle()
    {
        $this->info('🎴 Starting Booster Pack Generation...');
        $this->info('📦 Creating packs for sets with existing cards');

        try {
            // Get all card sets that have at least one associated card
            $this->info('🔍 Finding card sets with cards...');
            
            $cardSets = CardSet::whereHas('cards', function ($query) {
                $query->whereNotNull('scryfall_id');
            })
            ->orderBy('released_at', 'desc')
            ->get();

            if ($cardSets->isEmpty()) {
                $this->warn('⚠️  No card sets with cards found. Please run scryfall:sync-master first.');
                return 0;
            }

            $this->info("📊 Found {$cardSets->count()} card sets with cards");
            
            // Start progress bar
            $this->output->progressStart($cardSets->count());

            DB::transaction(function () use ($cardSets) {
                foreach ($cardSets as $cardSet) {
                    $this->generatePackForSet($cardSet);
                    $this->output->progressAdvance();
                }
            });

            $this->output->progressFinish();

            $this->info('✅ Booster pack generation completed!');
            $this->info('📈 Summary:');
            $this->info("   - Total processed: {$this->totalProcessed}");
            $this->info("   - Total created: {$this->totalCreated}");
            $this->info("   - Total updated: {$this->totalUpdated}");

            return 0;

        } catch (Exception $e) {
            $this->error('❌ Pack generation failed: ' . $e->getMessage());
            return 1;
        }
    }

    private function generatePackForSet(CardSet $cardSet): void
    {
        $this->totalProcessed++;

        // Determine price based on set type (assuming set_type exists in card_sets table)
        // If not, we'll need to add this column or determine it another way
        $price = $this->calculatePriceBySetType($cardSet);

        // Prepare pack data
        $packData = [
            'name' => "{$cardSet->name} Draft Booster",
            'price' => $price,
            'card_set_id' => $cardSet->code,
            'type' => 'DRAFT',
            'config' => [
                'rares' => 1,
                'uncommons' => 3,
                'commons' => 10,
                'foil' => true,
                'set_code' => $cardSet->code,
                'set_name' => $cardSet->name,
            ],
            'image_uri' => $cardSet->icon_svg_uri,
            'updated_at' => now(),
        ];

        // Create or update the booster pack
        $boosterPack = BoosterPack::updateOrCreate(
            ['card_set_id' => $cardSet->code],
            $packData
        );

        if ($boosterPack->wasRecentlyCreated) {
            $this->totalCreated++;
            $this->line(" 🆕 Created pack: {$packData['name']} (€{$price})");
        } else {
            $this->totalUpdated++;
            $this->line(" 🔄 Updated pack: {$packData['name']} (€{$price})");
        }
    }

    private function calculatePriceBySetType(CardSet $cardSet): float
    {
        // Since the migration doesn't show set_type column, we'll determine price by set characteristics
        // This is a fallback logic that can be enhanced once set_type is available
        
        $setName = strtolower($cardSet->name);
        $setCode = strtolower($cardSet->code);
        
        // Masters sets (typically have "Masters" in name or specific codes)
        if (
            str_contains($setName, 'masters') ||
            str_contains($setName, 'masterpiece') ||
            str_contains($setName, 'premium') ||
            in_array($setCode, ['mma', 'mm2', 'mm3', 'mma', 'mm2', 'mm3', 'uma', 'ima', 'a25', 'm19', 'm20', 'm21'])
        ) {
            return 11.99;
        }
        
        // Commander sets
        if (
            str_contains($setName, 'commander') ||
            str_contains($setName, 'commander') ||
            in_array($setCode, ['cma', 'c13', 'c14', 'c15', 'c16', 'c17', 'c18', 'c19', 'c20', 'c21', 'c22', 'cmr'])
        ) {
            return 6.99;
        }
        
        // Standard price for regular expansions, core sets, etc.
        return 4.49;
    }
}

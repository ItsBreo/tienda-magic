<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use App\Models\Card;
use App\Models\CardSet;
use Exception;

class ScryfallSyncMaster extends Command
{
    protected $signature = 'scryfall:sync-master {--batch-size=1000 : Number of cards to process in each batch}';
    protected $description = 'Master ETL command for Scryfall synchronization using bulk data';

    private string $bulkDataUrl;
    private string $tempFilePath;
    private int $batchSize;
    private int $totalProcessed = 0;
    private int $totalUpdated = 0;
    private int $totalInserted = 0;

    public function handle()
    {
        $this->batchSize = (int) $this->option('batch-size');
        $this->tempFilePath = storage_path('app/scryfall/default_cards.json');

        $this->info('🚀 Starting Scryfall Master Sync...');
        $this->info('📊 Batch size: ' . $this->batchSize);

        try {
            // Step 1: Extract - Get bulk data URL and download
            $this->extractBulkData();

            // Step 2: Transform & Load - Process JSON stream and update database
            $this->transformAndLoad();

            $this->info('✅ Sync completed successfully!');
            $this->info('📈 Summary:');
            $this->info("   - Total processed: {$this->totalProcessed}");
            $this->info("   - Total inserted: {$this->totalInserted}");
            $this->info("   - Total updated: {$this->totalUpdated}");

            return 0;

        } catch (Exception $e) {
            $this->error('❌ Sync failed: ' . $e->getMessage());
            return 1;
        } finally {
            // Step 3: Cleanup
            $this->cleanup();
        }
    }

    private function extractBulkData(): void
    {
        $this->info('📥 Step 1: Extracting bulk data from Scryfall...');

        // Get bulk data information
        $response = Http::withHeaders(['User-Agent' => 'TiendaMagicApp/1.0', 'Accept' => 'application/json'])->timeout(30)->get('https://api.scryfall.com/bulk-data');

        if (!$response->successful()) {
            throw new Exception('Failed to fetch bulk data information: ' . $response->status());
        }

        $bulkDataItems = $response->json('data');
        $defaultCards = collect($bulkDataItems)->firstWhere('type', 'default_cards');

        if (!$defaultCards) {
            throw new Exception('Default cards bulk data not found');
        }

        $this->bulkDataUrl = $defaultCards['download_uri'];
        $this->info("📡 Download URI: {$this->bulkDataUrl}");

        // Create directory if it doesn't exist
        $directory = dirname($this->tempFilePath);
        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        // Download the file using streaming to avoid memory issues
        $this->info('⬇️  Downloading bulk data file...');
        $this->info('📁 Saving to: ' . $this->tempFilePath);

        $startTime = microtime(true);

        $response = Http::withHeaders(['User-Agent' => 'TiendaMagicApp/1.0', 'Accept' => 'application/json'])->timeout(300)->sink($this->tempFilePath)->get($this->bulkDataUrl);

        if (!$response->successful()) {
            throw new Exception('Failed to download bulk data file: ' . $response->status());
        }

        $downloadTime = round(microtime(true) - $startTime, 2);
        $fileSize = filesize($this->tempFilePath);
        $fileSizeMB = round($fileSize / 1024 / 1024, 2);

        $this->info("✅ Download completed in {$downloadTime}s ({$fileSizeMB}MB)");
    }

    private function transformAndLoad(): void
    {
        $this->info('🔄 Step 2: Transforming and loading data...');

        if (!file_exists($this->tempFilePath)) {
            throw new Exception('Bulk data file not found: ' . $this->tempFilePath);
        }

        // Open file for streaming
        $fileHandle = fopen($this->tempFilePath, 'r');
        if (!$fileHandle) {
            throw new Exception('Failed to open bulk data file for reading');
        }

        // Skip opening bracket
        $firstChar = fread($fileHandle, 1);
        if ($firstChar !== '[') {
            fclose($fileHandle);
            throw new Exception('Invalid JSON format: expected array start');
        }

        $batch = [];
        $cardIndex = 0;

        // Start progress bar (we'll update it as we go)
        $this->output->progressStart();

        try {
            while (!feof($fileHandle)) {
                $cardJson = $this->readNextJsonObject($fileHandle);

                if ($cardJson === null) {
                    break; // End of array
                }

                $card = json_decode($cardJson, true);

                if (!$card || !isset($card['id'])) {
                    continue; // Skip invalid entries
                }

                // Transform data
                $transformedCard = $this->transformCard($card);

                if ($transformedCard) {
                    $batch[] = $transformedCard;
                    $cardIndex++;
                    $this->totalProcessed++;
                }

                // Process batch when it reaches the specified size
                if (count($batch) >= $this->batchSize) {
                    $this->processBatch($batch);
                    $batch = [];

                    // Update progress bar
                    $this->output->progressAdvance($this->batchSize);
                }
            }

            // Process remaining cards in the last batch
            if (!empty($batch)) {
                $this->processBatch($batch);
                $this->output->progressAdvance(count($batch));
            }

        } finally {
            fclose($fileHandle);
            $this->output->progressFinish();
        }
    }

    private function readNextJsonObject($fileHandle): ?string
    {
        $json = '';
        $bracketCount = 0;
        $inString = false;
        $escaped = false;

        while (!feof($fileHandle)) {
            $char = fread($fileHandle, 1);

            if ($char === '') {
                continue;
            }

            $json .= $char;

            if ($escaped) {
                $escaped = false;
                continue;
            }

            if ($char === '\\') {
                $escaped = true;
                continue;
            }

            if ($char === '"' && !$escaped) {
                $inString = !$inString;
                continue;
            }

            if (!$inString) {
                if ($char === '{') {
                    $bracketCount++;
                } elseif ($char === '}') {
                    $bracketCount--;

                    if ($bracketCount === 0) {
                        // Read until we find the comma or end of array
                        while (!feof($fileHandle)) {
                            $nextChar = fread($fileHandle, 1);
                            if ($nextChar === ',' || $nextChar === ']') {
                                break;
                            }
                        }
                        return $json;
                    }
                }
            }
        }

        return null;
    }

    private function transformCard(array $card): ?array
    {
        // Skip tokens and non-game pieces
        if (isset($card['layout']) && in_array($card['layout'], ['token', 'double_faced_token', 'emblem'])) {
            return null;
        }

        // Extract image URI
        $imageUri = null;
        if (isset($card['image_uris']['normal'])) {
            $imageUri = $card['image_uris']['normal'];
        } elseif (isset($card['card_faces'][0]['image_uris']['normal'])) {
            $imageUri = $card['card_faces'][0]['image_uris']['normal'];
        }

        // Calculate market average price
        $marketAvgPrice = 0.50;
        if (isset($card['prices']['eur']) && $card['prices']['eur'] !== null) {
            $marketAvgPrice = (float) $card['prices']['eur'];
        } elseif (isset($card['prices']['usd']) && $card['prices']['usd'] !== null) {
            $marketAvgPrice = (float) $card['prices']['usd'];
        }

        // Find card set ID
        $cardSetId = null;
        $setCode = $card['set'] ?? null;
        if ($setCode) {
            $cardSet = CardSet::whereRaw('LOWER(code) = ?', [strtolower($setCode)])->first();
            $cardSetId = $cardSet ? $cardSet->id : null;
        }

        return [
            'scryfall_id' => $card['id'],
            'name' => $card['name'] ?? '',
            'set_code' => $setCode,
            'collector_number' => $card['collector_number'] ?? '',
            'rarity' => $card['rarity'] ?? 'common',
            'image_uri' => $imageUri,
            'price_eur' => $card['prices']['eur'] ?? null,
            'price_usd' => $card['prices']['usd'] ?? null,
            'market_avg_price' => $marketAvgPrice,
            'mana_value' => $card['cmc'] ?? 0,
            'card_set_id' => $cardSetId,
            'data' => $card,
            'updated_at' => now(),
        ];
    }

    private function processBatch(array $batch): void
    {
        if (empty($batch)) {
            return;
        }

        DB::transaction(function () use ($batch) {
            foreach ($batch as $cardData) {
                $result = Card::updateOrCreate(
                    ['scryfall_id' => $cardData['scryfall_id']],
                    $cardData
                );

                if ($result->wasRecentlyCreated) {
                    $this->totalInserted++;
                } else {
                    $this->totalUpdated++;
                }
            }
        });

        // Show batch progress
        $this->line(" Processed batch: {$this->totalProcessed} cards ({$this->totalInserted} new, {$this->totalUpdated} updated)");
    }

    private function cleanup(): void
    {
        $this->info('🧹 Step 3: Cleaning up temporary files...');

        if (file_exists($this->tempFilePath)) {
            if (unlink($this->tempFilePath)) {
                $this->info('✅ Temporary file deleted successfully');
            } else {
                $this->warn('⚠️  Warning: Could not delete temporary file');
            }
        } else {
            $this->info('ℹ️  No temporary file to clean up');
        }
    }
}

<?php

namespace App\Observers;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class UserObserver
{
    /**
     * Handle the User "deleting" event.
     */
    public function deleting(User $user): void
    {
        if (!$user->isForceDeleting()) {
            return;
        }

        $id = $user->id;

        $deleteWithColumnCheck = function ($table, $column = 'user_id', $additionalWhere = null) use ($id) {
            try {
                if (!Schema::hasTable($table)) return;
                if (!Schema::hasColumn($table, $column)) return;
                
                $query = DB::table($table)->where($column, $id);
                if ($additionalWhere) {
                    $additionalWhere($query);
                }
                $query->delete();
            } catch (\Exception $e) {
                Log::error("UserObserver Error deleting from {$table}: " . $e->getMessage());
            }
        };

        // 1. DEVOLUCIÓN DE SOBRES AL STOCK
        try {
            if (Schema::hasTable('inventory_pack') && Schema::hasTable('booster_pack')) {
                $userPacks = DB::table('inventory_pack')->where('user_id', $id)->get();
                foreach ($userPacks as $pack) {
                    DB::table('booster_pack')
                        ->where('id', $pack->booster_pack_id)
                        ->increment('stock', $pack->quantity);
                }
            }
        } catch (\Exception $e) {
            Log::error("UserObserver: Error returning packs: " . $e->getMessage());
        }

        // 2. LIMPIEZA DE RELACIONES (Orden importa por FKs)
        
        // Items de carritos y órdenes (borrar hijos primero)
        try {
            if (Schema::hasTable('cart_item') && Schema::hasTable('cart')) {
                $cartIds = DB::table('cart')->where('user_id', $id)->pluck('id');
                DB::table('cart_item')->whereIn('cart_id', $cartIds)->delete();
            }
        } catch (\Exception $e) {}
        
        try {
            if (Schema::hasTable('order_items') && Schema::hasTable('orders')) {
                $orderIds = DB::table('orders')->where('buyer_id', $id)->orWhere('seller_id', $id)->pluck('id');
                DB::table('order_items')->whereIn('order_id', $orderIds)->delete();
            }
        } catch (\Exception $e) {}

        // Cartas de mazos
        try {
            if (Schema::hasTable('deck_card') && Schema::hasTable('deck')) {
                $deckIds = DB::table('deck')->where('user_id', $id)->pluck('id');
                DB::table('deck_card')->whereIn('deck_id', $deckIds)->delete();
            }
        } catch (\Exception $e) {}

        $deleteWithColumnCheck('user_role');
        $deleteWithColumnCheck('user_achievement');
        $deleteWithColumnCheck('achievement_user');
        
        $deleteWithColumnCheck('threads', 'user_id');
        $deleteWithColumnCheck('comments', 'user_id');
        $deleteWithColumnCheck('conversations', 'user_id');
        $deleteWithColumnCheck('conversation_participants', 'user_id');
        $deleteWithColumnCheck('messages', 'user_id');
        
        $deleteWithColumnCheck('cart', 'user_id');
        
        $deleteWithColumnCheck('orders', 'buyer_id', function ($query) use ($id) {
            $query->orWhere('seller_id', $id);
        });
        
        $deleteWithColumnCheck('market_listings', 'seller_id');
        $deleteWithColumnCheck('wallet_transaction', 'user_id');
        $deleteWithColumnCheck('inventory_card', 'user_id');
        $deleteWithColumnCheck('inventory_pack', 'user_id');
        $deleteWithColumnCheck('deck', 'user_id');

        // 3. PERFIL Y PREFERENCIAS (Últimos antes del usuario)
        $deleteWithColumnCheck('profile', 'user_id');
        $deleteWithColumnCheck('user_preference', 'user_id');
    }
}

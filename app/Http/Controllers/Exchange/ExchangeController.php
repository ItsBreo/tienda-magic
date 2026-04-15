<?php

namespace App\Http\Controllers\Exchange;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\Exchange;
use App\Models\ExchangeRequest;
use App\Models\InventoryCard;
use App\Notifications\TradeRequestedNotification;
use Illuminate\Support\Facades\DB;
use OpenApi\Attributes as OA;

class ExchangeController extends Controller
{
    #[OA\Get(
        path: "/api/exchanges",
        summary: "Listar intercambios",
        description: "Obtiene los intercambios activos en el mercado.",
        tags: ["Exchanges"]
    )]
    #[OA\Response(response: 200, description: "Lista de intercambios")]
    public function index(Request $request)
    {
        $exchanges = Exchange::with(['user', 'offeredCard.card', 'requestedCard'])
            ->where('status', 'active')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($exchanges);
    }

    #[OA\Post(
        path: "/api/exchanges",
        summary: "Crear listado de intercambio",
        description: "El usuario ofrece una carta de su inventario pidiendo opcionalmente una carta específica a cambio.",
        tags: ["Exchanges"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(properties: [
            new OA\Property(property: "offered_inventory_card_id", type: "integer"),
            new OA\Property(property: "requested_card_id", type: "integer", nullable: true)
        ])
    )]
    #[OA\Response(response: 201, description: "Listado de intercambio creado")]
    public function store(Request $request)
    {
        $request->validate([
            'offered_inventory_card_id' => 'required|exists:inventory_card,id',
            'requested_card_id' => 'nullable|exists:cards,id',
        ]);

        $user = auth()->user();
        
        // Verificamos que el usuario tenga esa carta y haya cantidad
        $invCard = InventoryCard::where('id', $request->offered_inventory_card_id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        if ($invCard->quantity <= $invCard->quantity_locked) {
            return response()->json(['message' => 'No tienes cantidad disponible de esta carta para intercambiar.'], 400);
        }

        DB::beginTransaction();
        try {
            // Bloqueamos 1 carta
            $invCard->increment('quantity_locked', 1);

            $exchange = Exchange::create([
                'user_id' => $user->id,
                'offered_inventory_card_id' => $request->offered_inventory_card_id,
                'requested_card_id' => $request->requested_card_id,
                'status' => 'active',
            ]);

            DB::commit();
            return response()->json($exchange, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error al crear el intercambio'], 500);
        }
    }

    #[OA\Post(
        path: "/api/exchanges/{id}/request",
        summary: "Solicitar un intercambio",
        description: "Envía una solicitud proponiendo una carta a un listado de intercambio activo.",
        tags: ["Exchanges"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID del intercambio activo", schema: new OA\Schema(type: "integer"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(properties: [
            new OA\Property(property: "offered_inventory_card_id", type: "integer")
        ])
    )]
    #[OA\Response(response: 201, description: "Solicitud de intercambio creada")]
    public function requestExchange(Request $request, $id)
    {
        $request->validate([
            'offered_inventory_card_id' => 'required|exists:inventory_card,id',
        ]);

        $exchange = Exchange::where('id', $id)->where('status', 'active')->firstOrFail();
        $user = auth()->user();

        if ($exchange->user_id === $user->id) {
            return response()->json(['message' => 'No puedes solicitarte un intercambio a ti mismo.'], 400);
        }

        // Si el exchange pidió una carta específica, validar
        if ($exchange->requested_card_id) {
            $offeredInvCard = InventoryCard::findOrFail($request->offered_inventory_card_id);
            if ($offeredInvCard->card_id !== $exchange->requested_card_id) {
                return response()->json(['message' => 'El creador pide una carta específica.'], 400);
            }
        }

        $invCard = InventoryCard::where('id', $request->offered_inventory_card_id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        if ($invCard->quantity <= $invCard->quantity_locked) {
            return response()->json(['message' => 'No tienes cantidad disponible de esta carta.'], 400);
        }

        DB::beginTransaction();
        try {
            $invCard->increment('quantity_locked', 1);

            $exchangeRequest = ExchangeRequest::create([
                'exchange_id' => $exchange->id,
                'user_id' => $user->id,
                'offered_inventory_card_id' => $request->offered_inventory_card_id,
                'status' => 'pending',
            ]);

            // Notify poster
            $exchange->user->notify(new TradeRequestedNotification($exchangeRequest));

            DB::commit();
            return response()->json($exchangeRequest, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error al solicitar el intercambio'], 500);
        }
    }
}

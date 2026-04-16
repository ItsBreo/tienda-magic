<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use OpenApi\Attributes as OA;

class WalletController extends Controller
{
    /**
     * Crear una sesión de recarga de wallet con Stripe Checkout.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    #[OA\Post(
        path: "/api/wallet/recharge",
        summary: "Recargar billetera",
        description: "Inicia el flujo de recarga de saldo en la billetera virtual mediante Stripe.",
        tags: ["Wallet"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(properties: [
            new OA\Property(property: "amount", type: "number", description: "Cantidad a recargar (5, 10, 20 o 50)")
        ])
    )]
    #[OA\Response(response: 200, description: "Sesión de Stripe Checkout creada exitosamente")]
    #[OA\Response(response: 422, description: "Error de validación del monto")]
    public function createRechargeSession(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|in:5,10,20,50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'El monto debe ser uno de: 5, 10, 20 o 50 euros',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $amount = $request->amount;
            $user = $request->user();

            // Configurar la API Key de Stripe
            \Stripe\Stripe::setApiKey(config('services.stripe.secret'));

            // Crear la sesión de Checkout de Stripe
            $session = \Stripe\Checkout\Session::create([
                'payment_method_types' => ['card'],
                'line_items' => [[
                    'price_data' => [
                        'currency' => 'eur',
                        'product_data' => [
                            'name' => 'Recarga de Saldo - Tienda Magic',
                            'description' => 'Añadir fondos a la billetera virtual',
                        ],
                        'unit_amount' => $amount * 100, // IMPORTANTE: Multiplicar por 100 para céntimos
                    ],
                    'quantity' => 1,
                ]],
                'mode' => 'payment',
                'success_url' => config('app.url') . '/wallet?status=success',
                'cancel_url' => config('app.url') . '/wallet?status=canceled',
                'metadata' => [
                    'user_id' => $user->id,
                    'amount' => $amount,
                    'type' => 'wallet_recharge'
                ],
                'customer_email' => $user->email,
                'billing_address_collection' => 'required',
                'shipping_address_collection' => [
                    'allowed_countries' => ['ES', 'FR', 'IT', 'DE', 'PT', 'NL', 'BE', 'AT']
                ],
                'allow_promotion_codes' => false,
                'payment_intent_data' => [
                    'metadata' => [
                        'user_id' => $user->id,
                        'amount' => $amount,
                        'type' => 'wallet_recharge'
                    ]
                ]
            ]);

            return response()->json([
                'success' => true,
                'session_url' => $session->url,
                'session_id' => $session->id
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear la sesión de pago: ' . $e->getMessage()
            ], 500);
        }
    }
}

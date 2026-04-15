<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use OpenApi\Attributes as OA;

class InvoiceController extends Controller
{
    /**
     * Descarga la factura en PDF de una orden específica.
     *
     * @param int $orderId
     */
    #[OA\Get(
        path: "/api/orders/{id}/invoice",
        summary: "Descargar Factura PDF",
        description: "Genera y descarga en formato PDF la factura de una compra pasada.",
        tags: ["Checkout"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID del pedido u orden", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Archivo PDF generado (application/pdf)")]
    #[OA\Response(response: 404, description: "Orden no encontrada o no autorizada")]
    public function download($orderId)
    {
        $user = Auth::user();

        // Buscar la orden y asegurar que pertenezca al usuario autenticado
        $order = Order::where('id', $orderId)
            ->where('user_id', $user->id)
            ->first();

        if (!$order) {
            return response()->json(['message' => 'Orden no encontrada o no autorizada.'], 404);
        }

        // Obtener los items de la orden
        $items = OrderItem::with('boosterPack.cardSet')->where('order_id', $order->id)->get();

        // Generar PDF
        $pdf = Pdf::loadView('pdf.invoice', [
            'order' => $order,
            'user' => $user,
            'items' => $items,
        ]);

        $fileName = 'Factura-FAC-' . str_pad($order->id, 6, '0', STR_PAD_LEFT) . '.pdf';

        // Retornar la descarga
        return $pdf->download($fileName);
    }
}

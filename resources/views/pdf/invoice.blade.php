<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Factura - Orden #{{ $order->id }}</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #333;
            line-height: 1.5;
            margin: 0;
            padding: 20px;
        }
        .header {
            margin-bottom: 30px;
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            color: #2c3e50;
        }
        .details {
            width: 100%;
            margin-bottom: 40px;
        }
        .details td {
            vertical-align: top;
        }
        .text-right {
            text-align: right;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
        }
        .items-table th, .items-table td {
            text-align: left;
            padding: 10px;
            border-bottom: 1px solid #ddd;
        }
        .items-table th {
            background-color: #f8f9fa;
            font-weight: bold;
        }
        .totals-table {
            width: 50%;
            float: right;
            border-collapse: collapse;
        }
        .totals-table td {
            padding: 8px 10px;
            border-bottom: 1px solid #eee;
        }
        .totals-table tr:last-child td {
            border-bottom: none;
            font-weight: bold;
            font-size: 1.2em;
            background-color: #f8f9fa;
        }
        .footer {
            clear: both;
            margin-top: 50px;
            text-align: center;
            font-size: 0.9em;
            color: #7f8c8d;
            border-top: 1px solid #ddd;
            padding-top: 15px;
        }
    </style>
</head>
<body>

    <div class="header">
        <table width="100%">
            <tr>
                <td>
                    <h1>Tienda Magic</h1>
                    <p>Factura Original</p>
                </td>
                <td class="text-right">
                    <strong>Factura #:</strong> FAC-{{ str_pad($order->id, 6, '0', STR_PAD_LEFT) }}<br>
                    <strong>Fecha:</strong> {{ $order->created_at->format('d/m/Y') }}<br>
                    <strong>Estado:</strong> Pagado
                </td>
            </tr>
        </table>
    </div>

    <table class="details">
        <tr>
            <td width="50%">
                <strong>Facturar a:</strong><br>
                {{ $user->name }}<br>
                {{ $user->email }}
            </td>
            <td width="50%" class="text-right">
                <strong>Emitido por:</strong><br>
                Tienda Magic Ltd.<br>
                Calle Principal 123, Ciudad<br>
                info@tiendamagic.com
            </td>
        </tr>
    </table>

    <table class="items-table">
        <thead>
            <tr>
                <th>Descripción</th>
                <th class="text-right">Cant.</th>
                <th class="text-right">Precio Unit.</th>
                <th class="text-right">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($items as $item)
            <tr>
                <td>{{ $item->boosterPack->name ?? 'Booster Pack' }} - Set: {{ $item->boosterPack->cardSet->name ?? 'N/A' }}</td>
                <td class="text-right">{{ $item->quantity }}</td>
                <td class="text-right">{{ number_format($item->price_at_purchase ?? $item->unit_price, 2) }} {{ $order->currency ?? 'EUR' }}</td>
                <td class="text-right">{{ number_format($item->quantity * ($item->price_at_purchase ?? $item->unit_price), 2) }} {{ $order->currency ?? 'EUR' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals-table">
        <tr>
            <td>Subtotal:</td>
            <td class="text-right">{{ number_format($order->subtotal ?? $order->total_price / 1.21, 2) }} {{ $order->currency ?? 'EUR' }}</td>
        </tr>
        <tr>
            <td>Impuestos (21%):</td>
            <td class="text-right">{{ number_format($order->tax ?? ($order->total_price - ($order->total_price / 1.21)), 2) }} {{ $order->currency ?? 'EUR' }}</td>
        </tr>
        <tr>
            <td><strong>Total:</strong></td>
            <td class="text-right"><strong>{{ number_format($order->total_price, 2) }} {{ $order->currency ?? 'EUR' }}</strong></td>
        </tr>
    </table>

    <div class="footer">
        <p>Gracias por tu compra en Tienda Magic. Si tienes alguna pregunta sobre esta factura, contáctanos.</p>
    </div>

</body>
</html>

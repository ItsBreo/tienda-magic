<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
</head>
<body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; padding: 20px;">
    <h2>¡Hola, {{ $user->name }}!</h2>
    
    <p>Gracias por tu compra en <strong>Tienda Magic</strong>.</p>
    
    <p>Hemos adjuntado el comprobante y la factura en formato PDF de tu orden <strong>#FAC-{{ str_pad($order->id, 6, '0', STR_PAD_LEFT) }}</strong> a este correo.</p>
    
    <p><strong>Total pagado:</strong> {{ number_format($order->total_price, 2) }} {{ $order->currency ?? 'EUR' }}</p>

    <br>
    <p>Si tienes alguna pregunta o problema con los artículos de tu compra, no dudes en responder a este correo.</p>
    
    <br>
    <p>Saludos,<br>
    El equipo de Tienda Magic</p>
</body>
</html>

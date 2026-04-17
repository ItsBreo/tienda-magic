<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Historial de Transacciones - Tienda Magic</title>
    <style>
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            color: #333;
            margin: 0;
            padding: 20px;
        }
        .header {
            border-bottom: 2px solid #10b981;
            padding-bottom: 10px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #10b981;
            margin: 0;
            font-size: 24px;
        }
        .user-info {
            margin-bottom: 30px;
        }
        .user-info p {
            margin: 5px 0;
            font-size: 14px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        th {
            background-color: #f3f4f6;
            text-align: left;
            padding: 10px;
            font-size: 12px;
            text-transform: uppercase;
            color: #666;
            border-bottom: 1px solid #e5e7eb;
        }
        td {
            padding: 12px 10px;
            font-size: 13px;
            border-bottom: 1px solid #e5e7eb;
        }
        .amount {
            font-weight: bold;
        }
        .amount-deposit {
            color: #059669;
        }
        .amount-expense {
            color: #dc2626;
        }
        .footer {
            text-align: center;
            font-size: 11px;
            color: #999;
            margin-top: 50px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Tienda Magic - Historial de Billetera</h1>
    </div>

    <div class="user-info">
        <p><strong>Usuario:</strong> {{ $user->username }} ({{ $user->email }})</p>
        <p><strong>Fecha de informe:</strong> {{ now()->format('d/m/Y H:i') }}</p>
        <p><strong>Saldo Actual:</strong> {{ number_format($user->wallet_balance, 2) }}€</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>Fecha</th>
                <th>Descripción</th>
                <th>Tipo</th>
                <th>Monto</th>
                <th>Saldo Post</th>
            </tr>
        </thead>
        <tbody>
            @foreach($transactions as $transaction)
                <tr>
                    <td>{{ $transaction->created_at->format('d/m/Y H:i') }}</td>
                    <td>{{ $transaction->description ?? 'Sin descripción' }}</td>
                    <td>{{ $transaction->type === 'deposit' ? 'Depósito' : 'Gasto' }}</td>
                    <td class="amount {{ $transaction->type === 'deposit' ? 'amount-deposit' : 'amount-expense' }}">
                        {{ $transaction->type === 'deposit' ? '+' : '-' }}{{ number_format($transaction->amount, 2) }}€
                    </td>
                    <td>{{ number_format($transaction->balance_after, 2) }}€</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        Este documento es un comprobante de movimientos de la billetera virtual de Tienda Magic.
    </div>
</body>
</html>

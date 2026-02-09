<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Iniciar Sesión - Tienda Magic</title>
    @vite('resources/css/app.css')
</head>
<body>
    <div id="app" data-page="{{ json_encode([
        'component' => 'auth/LoginExample',
        'props' => [
            'status' => session('status'),
            'canResetPassword' => Route::has('password.request'),
            'canRegister' => Route::has('register'),
        ],
        'url' => url()->current(),
        'version' => null,
    ]) }}"></div>
    @vite('resources/js/app.tsx')
</body>
</html>

<?php

namespace App\Http\Controllers;

use OpenApi\Attributes as OA;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

#[OA\Info(
    version: "1.0.0",
    description: "Documentación de la API de Tienda Magic Swagger OpenApi",
    title: "Tienda Magic API"
)]
#[OA\Contact(
    email: "soporte@tiendamagic.com"
)]
#[OA\SecurityScheme(
    securityScheme: "bearerAuth",
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT"
)]
abstract class Controller
{
    use AuthorizesRequests;
}

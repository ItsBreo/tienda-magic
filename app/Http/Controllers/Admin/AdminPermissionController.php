<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class AdminPermissionController extends Controller
{
    #[OA\Get(
        path: "/api/admin/permissions",
        summary: "Lista de todos los permisos",
        description: "Obtiene una lista de todos los permisos de sistema disponibles (solo admins).",
        tags: ["Admin"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Response(response: 200, description: "Lista de permisos")]
    public function index()
    {
        return response()->json(Permission::orderBy('name')->get());
    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AdminAuditLogController extends Controller
{
    /**
     * Display a listing of audit logs with basic filtering.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $query = AuditLog::with('user')->latest();

        // Filter by user
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by action slug
        if ($request->has('action')) {
            $query->where('action', 'like', '%' . $request->action . '%');
        }

        $logs = $query->paginate(30);

        return response()->json([
            'data' => $logs->items(),
            'current_page' => $logs->currentPage(),
            'last_page' => $logs->lastPage(),
            'total' => $logs->total(),
            'per_page' => $logs->perPage(),
        ]);
    }
}

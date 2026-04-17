<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditLogger
{
    /**
     * Records a new audit log entry.
     *
     * @param string $action The action being performed (e.g., 'auth.login')
     * @param mixed $target Optional target model instance or null
     * @param array $payload Optional additional metadata
     * @return AuditLog
     */
    public static function log(string $action, $target = null, array $payload = []): AuditLog
    {
        return AuditLog::create([
            'user_id'     => Auth::check() ? Auth::id() : null,
            'action'      => $action,
            'target_id'   => $target ? $target->getKey() : null,
            'target_type' => $target ? get_class($target) : null,
            'payload'     => $payload,
            'ip_address'  => Request::ip(),
            'user_agent'  => Request::userAgent(),
        ]);
    }
}

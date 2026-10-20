<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ActivityLogController extends Controller
{
    /**
     * Show everything that has happened in the system, newest first.
     */
    public function index(Request $request): Response
    {
        $userId = $request->integer('user') ?: null;

        $activities = ActivityLog::query()
            ->with('user:id,name')
            ->when($userId, fn ($query) => $query->where('user_id', $userId))
            ->latest('id')
            ->paginate(30)
            ->withQueryString()
            ->through(fn (ActivityLog $log) => [
                'id' => $log->id,
                'event' => $log->event,
                'subject' => $log->subject_type
                    ? Str::headline(class_basename($log->subject_type)).' #'.$log->subject_id
                    : null,
                'properties' => $log->properties,
                'user' => $log->user?->only('id', 'name'),
                'ip_address' => $log->ip_address,
                'created_at' => $log->created_at->toIso8601String(),
            ]);

        return Inertia::render('admin/activity-log/index', [
            'activities' => $activities,
        ]);
    }
}

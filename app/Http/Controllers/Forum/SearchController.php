<?php

namespace App\Http\Controllers\Forum;

use App\Http\Controllers\Controller;
use App\Models\Thread;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    /**
     * Handle the incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function __invoke(Request $request)
    {
        $query = $request->input('q');

        if (!$query || strlen($query) < 3) {
            return response()->json(['data' => []]);
        }

        $searchQuery = preg_replace('/[+\-><\(\)~*\"@]+/', ' ', $query);

        $threads = Thread::with(['user:id,name,username', 'forum:id,name,slug'])
            ->where(function ($q) use ($searchQuery) {
                $q->where('title', 'like', "%{$searchQuery}%")
                  ->orWhere('body', 'like', "%{$searchQuery}%")
                  ->orWhereHas('forum', function ($forumQuery) use ($searchQuery) {
                      $forumQuery->where('name', 'like', "%{$searchQuery}%");
                  });
            })
            ->orWhereJsonContains('tags', $searchQuery)
            ->orderBy('is_pinned', 'desc')
            ->orderBy('created_at', 'desc')
            ->take(50)
            ->get();

        return response()->json(['data' => $threads]);
    }
}

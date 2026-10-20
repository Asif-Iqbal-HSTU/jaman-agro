<?php

namespace App\Http\Middleware;

use App\Models\UnlockRequest;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'locale' => app()->getLocale(),
            'translations' => fn () => $this->translations(app()->getLocale()),
            // Unlock requests waiting for the administrator, shown as a badge in the menu.
            'pendingUnlocks' => fn () => $request->user()?->isAdmin()
                ? UnlockRequest::where('status', UnlockRequest::PENDING)->count()
                : 0,
            'editLockDays' => (int) config('factory.edit_lock_days', 3),
        ];
    }

    /**
     * Load the JSON translation strings (lang/{locale}.json) for the frontend.
     *
     * @return array<string, string>
     */
    protected function translations(string $locale): array
    {
        return app('translator')->getLoader()->load($locale, '*', '*');
    }
}

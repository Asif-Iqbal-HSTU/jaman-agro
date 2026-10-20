<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * The locales the application is translated into.
     *
     * @var list<string>
     */
    public const SUPPORTED = ['en', 'bn'];

    /**
     * Apply the signed in user's language, falling back to the guest's session choice.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $request->user()->locale ?? $request->session()->get('locale');

        if (in_array($locale, self::SUPPORTED, true)) {
            App::setLocale($locale);
        }

        return $next($request);
    }
}

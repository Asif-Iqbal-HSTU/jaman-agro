<?php

namespace App\Http\Controllers;

use App\Enums\PaymentMethod;
use App\Services\CashBook;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CashBookController extends Controller
{
    /**
     * Money in and out for a period.
     */
    public function __invoke(Request $request): Response
    {
        $validated = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'method' => ['nullable', Rule::enum(PaymentMethod::class)],
        ]);

        $from = isset($validated['from']) ? Date::parse($validated['from']) : Date::today()->startOfMonth();
        $to = isset($validated['to']) ? Date::parse($validated['to']) : Date::today();
        $method = isset($validated['method']) ? PaymentMethod::from($validated['method']) : null;

        return Inertia::render('cash-book/index', [
            'book' => CashBook::for($from, $to, $method),
            'filters' => ['from' => $from->toDateString(), 'to' => $to->toDateString(), 'method' => $method?->value],
            'methods' => PaymentMethod::options(),
        ]);
    }
}

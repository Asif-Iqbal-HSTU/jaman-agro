<?php

namespace App\Http\Controllers;

use App\Enums\PaymentMethod;
use App\Models\WageBonus;
use App\Models\WagePayment;
use App\Models\Worker;
use App\Services\WageSheet;
use App\Support\Decimal;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class WageController extends Controller
{
    /**
     * The pay sheet for a period, by default the most recent Sunday pay period.
     */
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);

        $periods = WageSheet::periods();
        $from = Date::parse($validated['from'] ?? $periods['sunday']['from']);
        $to = Date::parse($validated['to'] ?? $periods['sunday']['to']);
        $rows = WageSheet::for($from, $to);

        return Inertia::render('wages/index', [
            'rows' => $rows,
            'totals' => [
                'earned' => Decimal::add(...array_column($rows, 'earned')),
                'owed' => Decimal::add(...array_column($rows, 'owed')),
                'paid_in_period' => Decimal::add(...array_column($rows, 'paid_in_period')),
            ],
            'filters' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
            'periods' => $periods,
            'payments' => WagePayment::query()
                ->with('worker:id,name')
                ->whereDate('paid_on', '>=', $from)
                ->latest('id')
                ->limit(50)
                ->get(),
            'bonuses' => WageBonus::query()
                ->with('worker:id,name')
                ->whereDate('given_on', '>=', $from)->whereDate('given_on', '<=', $to)
                ->latest('id')
                ->get(),
            'methods' => PaymentMethod::options(),
            'today' => Date::today()->toDateString(),
        ]);
    }

    /**
     * Record wages paid to a worker.
     */
    public function pay(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'worker_id' => ['required', 'integer', Rule::exists(Worker::class, 'id')],
            'paid_on' => ['required', 'date', 'before_or_equal:today'],
            'period_from' => ['required', 'date'],
            'period_to' => ['required', 'date', 'after_or_equal:period_from'],
            'amount' => ['required', 'numeric', 'gt:0', 'max:9999999'],
            'method' => ['required', Rule::enum(PaymentMethod::class)],
            'reference' => ['nullable', 'string', 'max:100'],
        ]);

        WagePayment::create([...$validated, 'recorded_by' => $request->user()->id]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Wages paid.')]);

        return back();
    }

    /**
     * Give a worker a bonus (heat, cold, Eid and the like).
     */
    public function bonus(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'worker_id' => ['required', 'integer', Rule::exists(Worker::class, 'id')],
            'given_on' => ['required', 'date', 'before_or_equal:today'],
            'amount' => ['required', 'numeric', 'gt:0', 'max:9999999'],
            'reason' => ['required', 'string', 'max:255'],
        ]);

        WageBonus::create([...$validated, 'recorded_by' => $request->user()->id]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Bonus added.')]);

        return back();
    }
}

<?php

namespace App\Http\Controllers;

use App\Enums\StockMovementType;
use App\Models\ActivityLog;
use App\Models\StockMovement;
use App\Models\TeaGrade;
use App\Support\Decimal;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class StockController extends Controller
{
    /**
     * Made tea in stock per grade, and the ledger lines behind it.
     */
    public function index(Request $request): Response
    {
        $request->validate(['grade' => ['nullable', 'integer']]);
        $gradeId = $request->integer('grade') ?: null;

        // Plain rows, not models: the type stays a string so it can key the totals.
        $byType = StockMovement::query()->toBase()
            ->selectRaw('tea_grade_id, type, SUM(quantity_kg) as total')
            ->groupBy('tea_grade_id', 'type')
            ->get()
            ->groupBy('tea_grade_id');

        $grades = TeaGrade::ordered()->get(['id', 'code', 'name', 'is_active'])
            ->map(function (TeaGrade $grade) use ($byType) {
                $totals = $byType->get($grade->id, collect())->pluck('total', 'type');

                return [
                    ...$grade->only('id', 'code', 'name', 'is_active'),
                    'produced' => Decimal::add($totals[StockMovementType::Production->value] ?? 0),
                    'adjusted' => Decimal::add($totals[StockMovementType::Adjustment->value] ?? 0),
                    'balance' => Decimal::add(...$totals->values()->all()),
                ];
            })
            // Hide switched-off grades that never had any stock.
            ->filter(fn (array $g) => $g['is_active'] || $byType->has($g['id']))
            ->values();

        return Inertia::render('stock/index', [
            'grades' => $grades,
            'total' => Decimal::add(...$grades->pluck('balance')->all()),
            'movements' => StockMovement::query()
                ->with('grade:id,code', 'recorder:id,name')
                ->when($gradeId, fn ($query, $id) => $query->where('tea_grade_id', $id))
                ->orderByDesc('moved_on')->orderByDesc('id')
                ->paginate(30)
                ->withQueryString(),
            'filters' => ['grade' => $gradeId],
        ]);
    }

    /**
     * Show the form for correcting stock by hand.
     */
    public function createAdjustment(): Response
    {
        return Inertia::render('stock/adjust', [
            'grades' => TeaGrade::ordered()->where('is_active', true)->get(['id', 'code', 'name']),
            'balances' => StockMovement::balances(),
            'today' => Date::today()->toDateString(),
        ]);
    }

    /**
     * Add or remove made tea after a recount, damage, samples and the like.
     */
    public function storeAdjustment(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'moved_on' => ['required', 'date', 'before_or_equal:today'],
            'tea_grade_id' => ['required', 'integer', Rule::exists(TeaGrade::class, 'id')],
            'direction' => ['required', Rule::in(['add', 'remove'])],
            'quantity_kg' => ['required', 'numeric', 'gt:0', 'max:999999'],
            'reason' => ['required', 'string', 'max:255'],
        ]);

        DB::transaction(function () use ($validated, $request) {
            $movement = StockMovement::create([
                'moved_on' => $validated['moved_on'],
                'tea_grade_id' => $validated['tea_grade_id'],
                'quantity_kg' => $validated['direction'] === 'remove'
                    ? Decimal::sub(0, $validated['quantity_kg'])
                    : Decimal::add($validated['quantity_kg']),
                'type' => StockMovementType::Adjustment,
                'reason' => $validated['reason'],
                'recorded_by' => $request->user()->id,
            ]);

            StockMovement::ensureNotNegative([$movement->tea_grade_id]);

            ActivityLog::record('created', $movement, [
                'attributes' => $movement->only('moved_on', 'tea_grade_id', 'quantity_kg', 'reason'),
            ]);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Stock adjusted.')]);

        return to_route('stock.index');
    }
}

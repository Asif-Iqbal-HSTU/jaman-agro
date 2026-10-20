<?php

namespace App\Http\Controllers;

use App\Actions\Production\SaveProductionBatch;
use App\Http\Requests\Production\ProductionBatchRequest;
use App\Models\LeafReceipt;
use App\Models\ProductionBatch;
use App\Models\TeaGrade;
use App\Support\Decimal;
use App\Support\EditLock;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Inertia\Inertia;
use Inertia\Response;

class ProductionBatchController extends Controller
{
    /**
     * A month of production with made tea per grade and recovery.
     */
    public function index(Request $request): Response
    {
        $request->validate(['month' => ['nullable', 'date_format:Y-m']]);

        $start = $request->filled('month')
            ? Date::createFromFormat('Y-m-d', $request->string('month').'-01')->startOfDay()
            : Date::today()->startOfMonth();
        $end = $start->endOfMonth();

        $batches = ProductionBatch::query()
            ->with('outputs:id,production_batch_id,tea_grade_id,kg')
            ->withSum('outputs as made_tea_kg', 'kg')
            ->whereDate('produced_on', '>=', $start)
            ->whereDate('produced_on', '<=', $end)
            ->orderBy('produced_on')->orderBy('id')
            ->get()
            ->map(fn (ProductionBatch $batch) => [
                ...$batch->only('id', 'produced_on', 'green_leaf_kg', 'withering_hours', 'fermentation_minutes', 'dryer_temp_c', 'notes', 'edit_lock'),
                'edited_at' => $batch->edited_at?->toIso8601String(),
                'made_tea_kg' => Decimal::add($batch->getAttribute('made_tea_kg')),
                'recovery' => ProductionBatch::recovery($batch->getAttribute('made_tea_kg'), $batch->green_leaf_kg),
                'outputs' => $batch->outputs->mapWithKeys(fn ($o) => [$o->tea_grade_id => $o->kg]),
            ]);

        $greenLeaf = Decimal::add(...$batches->pluck('green_leaf_kg')->all());
        $madeTea = Decimal::add(...$batches->pluck('made_tea_kg')->all());
        $usedGradeIds = $batches->flatMap(fn ($b) => $b['outputs']->keys())->unique()->all();

        return Inertia::render('production/index', [
            'month' => $start->format('Y-m'),
            'batches' => $batches,
            'grades' => TeaGrade::ordered()
                ->where(fn ($query) => $query->where('is_active', true)->orWhereIn('id', $usedGradeIds))
                ->get(['id', 'code', 'name']),
            'totals' => [
                'batches' => $batches->count(),
                'green_leaf_kg' => $greenLeaf,
                'made_tea_kg' => $madeTea,
                'recovery' => ProductionBatch::recovery($madeTea, $greenLeaf),
                'leaf_received_kg' => Decimal::add(LeafReceipt::query()
                    ->whereDate('received_on', '>=', $start)
                    ->whereDate('received_on', '<=', $end)
                    ->sum('net_kg')),
                'by_grade' => $batches->flatMap(fn ($b) => $b['outputs']->map(fn ($kg, $gradeId) => compact('gradeId', 'kg')))
                    ->groupBy('gradeId')
                    ->map(fn ($rows) => Decimal::add(...$rows->pluck('kg')->all())),
            ],
        ]);
    }

    /**
     * Show the form for recording a batch.
     */
    public function create(Request $request): Response
    {
        $request->validate(['date' => ['nullable', 'date', 'before_or_equal:today']]);

        return Inertia::render('production/create', [
            ...$this->formOptions(),
            'date' => $request->filled('date') ? $request->string('date')->toString() : Date::today()->toDateString(),
        ]);
    }

    /**
     * Record a batch and add its made tea to stock.
     */
    public function store(ProductionBatchRequest $request, SaveProductionBatch $save): RedirectResponse
    {
        $batch = $save->handle(
            new ProductionBatch(['recorded_by' => $request->user()->id]),
            $request->batchData(),
            $request->outputs(),
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Production batch saved.')]);

        return to_route('production.index', ['month' => $batch->produced_on->format('Y-m')]);
    }

    /**
     * Show the form for correcting a batch.
     */
    public function edit(ProductionBatch $production): Response
    {
        EditLock::ensureEditable($production);

        $production->load('outputs:id,production_batch_id,tea_grade_id,kg');

        return Inertia::render('production/edit', [
            ...$this->formOptions($production->outputs->pluck('tea_grade_id')->all()),
            'batch' => [
                ...$production->only('id', 'produced_on', 'green_leaf_kg', 'withering_hours', 'fermentation_minutes', 'dryer_temp_c', 'notes'),
                'outputs' => $production->outputs->mapWithKeys(fn ($o) => [$o->tea_grade_id => $o->kg]),
            ],
        ]);
    }

    /**
     * Correct a batch; its stock lines follow.
     */
    public function update(ProductionBatchRequest $request, ProductionBatch $production, SaveProductionBatch $save): RedirectResponse
    {
        EditLock::ensureEditable($production);

        $save->handle($production, $request->batchData(), $request->outputs());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Production batch updated.')]);

        return to_route('production.index', ['month' => $production->produced_on->format('Y-m')]);
    }

    /**
     * Remove a batch entered by mistake, and its tea from stock.
     */
    public function destroy(ProductionBatch $production, SaveProductionBatch $save): RedirectResponse
    {
        EditLock::ensureEditable($production);

        $month = $production->produced_on->format('Y-m');

        $save->delete($production);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Production batch deleted.')]);

        return to_route('production.index', ['month' => $month]);
    }

    /**
     * Grades and recent leaf intake for the batch form.
     *
     * @param  array<int, int>  $includeGradeIds
     * @return array<string, mixed>
     */
    private function formOptions(array $includeGradeIds = []): array
    {
        return [
            'grades' => TeaGrade::ordered()
                ->where(fn ($query) => $query->where('is_active', true)->orWhereIn('id', $includeGradeIds))
                ->get(['id', 'code', 'name']),
            // Net leaf received per day, to suggest how much leaf went into a batch.
            'leafReceived' => LeafReceipt::query()
                ->whereDate('received_on', '>=', Date::today()->subDays(60))
                ->get(['received_on', 'net_kg'])
                ->groupBy(fn (LeafReceipt $r) => $r->received_on->toDateString())
                ->map(fn ($receipts) => Decimal::add(...$receipts->pluck('net_kg')->all())),
        ];
    }
}

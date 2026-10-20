<?php

namespace App\Http\Controllers;

use App\Enums\WorkerPayType;
use App\Models\LeafReceipt;
use App\Models\PieceRate;
use App\Models\PieceWork;
use App\Models\Worker;
use App\Support\Decimal;
use App\Support\EditLock;
use Carbon\CarbonInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PieceWorkController extends Controller
{
    /**
     * A day's contract work: who did which job, how much, and what it earns.
     */
    public function index(Request $request): Response
    {
        $date = $this->dateFrom($request);

        $works = PieceWork::query()
            ->with('worker:id,name', 'job:id,name,unit')
            ->whereDate('work_date', $date)
            ->orderBy('id')
            ->get();

        return Inertia::render('piece-work/index', [
            'date' => $date->toDateString(),
            'today' => Date::today()->toDateString(),
            'works' => $works,
            'workers' => Worker::where('pay_type', WorkerPayType::Contract)->where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'jobs' => PieceRate::ordered()->where('is_active', true)->get(['id', 'name', 'unit', 'rate']),
            // The day's net leaf, to fill in quickly for jobs paid per kg of leaf.
            'leafKg' => Decimal::add(LeafReceipt::whereDate('received_on', $date)->sum('net_kg')),
            'total' => Decimal::add(...$works->pluck('amount')->all()),
        ]);
    }

    /**
     * Record a piece of contract work at the job's current rate.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'work_date' => ['required', 'date', 'before_or_equal:today'],
            'worker_id' => ['required', 'integer', Rule::exists(Worker::class, 'id')->where('pay_type', WorkerPayType::Contract->value)],
            'piece_rate_id' => ['required', 'integer', Rule::exists(PieceRate::class, 'id')],
            'quantity' => ['required', 'numeric', 'gt:0', 'max:9999999'],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        PieceWork::create([
            ...$validated,
            'rate' => PieceRate::query()->whereKey($validated['piece_rate_id'])->firstOrFail()->rate,
            'recorded_by' => $request->user()->id,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Work recorded.')]);

        return to_route('piece-work.index', ['date' => $validated['work_date']]);
    }

    /**
     * Remove work entered by mistake.
     */
    public function destroy(PieceWork $pieceWork): RedirectResponse
    {
        EditLock::ensureEditable($pieceWork);

        $date = $pieceWork->work_date->toDateString();
        $pieceWork->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Work deleted.')]);

        return to_route('piece-work.index', ['date' => $date]);
    }

    private function dateFrom(Request $request): CarbonInterface
    {
        $request->validate(['date' => ['nullable', 'date', 'before_or_equal:today']]);

        return $request->filled('date') ? Date::parse($request->string('date')->toString()) : Date::today();
    }
}

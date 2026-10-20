<?php

namespace App\Http\Controllers;

use App\Enums\WorkerPayType;
use App\Models\Attendance;
use App\Models\Worker;
use App\Support\Decimal;
use App\Support\EditLock;
use Carbon\CarbonInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController extends Controller
{
    /**
     * The day's attendance sheet: every hourly worker with time in and time out.
     */
    public function index(Request $request): Response
    {
        $date = $this->dateFrom($request);

        $records = Attendance::whereDate('work_date', $date)->get()->keyBy('worker_id');

        $workers = Worker::query()
            ->where('pay_type', WorkerPayType::Hourly)
            ->where(fn ($q) => $q->where('is_active', true)->orWhereIn('id', $records->keys()))
            ->orderBy('name')
            ->get(['id', 'name', 'hourly_rate'])
            ->map(fn (Worker $w) => [
                ...$w->only('id', 'name', 'hourly_rate'),
                'attendance' => $records->get($w->id)?->only('id', 'time_in', 'time_out', 'hours', 'rate', 'amount', 'notes', 'edit_lock', 'edited_at'),
            ]);

        return Inertia::render('attendance/index', [
            'date' => $date->toDateString(),
            'today' => Date::today()->toDateString(),
            'workers' => $workers,
            'totals' => [
                'present' => $records->count(),
                'hours' => Decimal::add(...$records->pluck('hours')->all()),
                'amount' => Decimal::add(...$records->pluck('amount')->all()),
            ],
        ]);
    }

    /**
     * Save the whole sheet: new lines are added, changed lines updated, cleared lines removed.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'work_date' => ['required', 'date', 'before_or_equal:today'],
            'rows' => ['array'],
            'rows.*.worker_id' => ['required', 'integer', 'exists:workers,id'],
            'rows.*.time_in' => ['nullable', 'date_format:H:i', 'required_with:rows.*.time_out'],
            'rows.*.time_out' => ['nullable', 'date_format:H:i', 'required_with:rows.*.time_in'],
            'rows.*.notes' => ['nullable', 'string', 'max:255'],
        ]);

        $date = Date::parse($validated['work_date']);
        $existing = Attendance::whereDate('work_date', $date)->get()->keyBy('worker_id');
        $workers = Worker::whereIn('id', array_column($validated['rows'] ?? [], 'worker_id'))->get()->keyBy('id');

        DB::transaction(function () use ($validated, $date, $existing, $workers, $request) {
            foreach ($validated['rows'] ?? [] as $row) {
                $record = $existing->get($row['worker_id']);
                $filled = ! empty($row['time_in']) && ! empty($row['time_out']);

                if (! $filled) {
                    if ($record) {
                        EditLock::ensureEditable($record);
                        $record->delete();
                    }

                    continue;
                }

                $values = ['time_in' => $row['time_in'], 'time_out' => $row['time_out'], 'notes' => $row['notes'] ?? null];

                if ($record) {
                    // The table keeps seconds (08:00:00); the sheet sends 08:00. Only real changes count.
                    $unchanged = substr($record->time_in, 0, 5) === $values['time_in']
                        && substr($record->time_out, 0, 5) === $values['time_out']
                        && $record->notes === $values['notes'];

                    if (! $unchanged) {
                        EditLock::ensureEditable($record);
                        $record->update($values);
                    }

                    continue;
                }

                Attendance::create([
                    ...$values,
                    'work_date' => $date->toDateString(),
                    'worker_id' => $row['worker_id'],
                    'rate' => $workers->get($row['worker_id'])->hourly_rate ?? 0,
                    'recorded_by' => $request->user()->id,
                ]);
            }
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Attendance saved.')]);

        return to_route('attendance.index', ['date' => $date->toDateString()]);
    }

    private function dateFrom(Request $request): CarbonInterface
    {
        $request->validate(['date' => ['nullable', 'date', 'before_or_equal:today']]);

        return $request->filled('date') ? Date::parse($request->string('date')->toString()) : Date::today();
    }
}

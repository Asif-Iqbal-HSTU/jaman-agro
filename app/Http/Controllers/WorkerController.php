<?php

namespace App\Http\Controllers;

use App\Enums\WorkerPayType;
use App\Models\Worker;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class WorkerController extends Controller
{
    /**
     * Everyone paid by the factory, with what each is owed now.
     */
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();

        $workers = Worker::query()
            ->withWageTotals()
            ->when($search !== '', fn ($q) => $q->where('name', 'like', "%{$search}%"))
            ->orderByDesc('is_active')->orderBy('name')
            ->paginate(50)
            ->withQueryString()
            ->through(fn (Worker $w) => [
                ...$w->only('id', 'name', 'phone', 'pay_type', 'hourly_rate', 'is_active', 'notes'),
                'owed' => $w->owed(),
            ]);

        return Inertia::render('workers/index', [
            'workers' => $workers,
            'filters' => ['search' => $search],
            'payTypes' => WorkerPayType::options(),
        ]);
    }

    /**
     * Show the form for adding a worker.
     */
    public function create(): Response
    {
        return Inertia::render('workers/create', ['payTypes' => WorkerPayType::options()]);
    }

    /**
     * Add a worker.
     */
    public function store(Request $request): RedirectResponse
    {
        Worker::create($this->validated($request));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Worker added.')]);

        return to_route('workers.index');
    }

    /**
     * Show the form for editing a worker.
     */
    public function edit(Worker $worker): Response
    {
        return Inertia::render('workers/edit', [
            'worker' => $worker,
            'payTypes' => WorkerPayType::options(),
        ]);
    }

    /**
     * Update a worker. A new hourly rate applies to days recorded from now on.
     */
    public function update(Request $request, Worker $worker): RedirectResponse
    {
        $worker->update($this->validated($request));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Worker updated.')]);

        return to_route('workers.index');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        $hourly = $request->input('pay_type') === WorkerPayType::Hourly->value;

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'pay_type' => ['required', Rule::enum(WorkerPayType::class)],
            'hourly_rate' => [$hourly ? 'required' : 'nullable', 'numeric', 'gt:0', 'max:99999'],
            'is_active' => ['boolean'],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        return [...$validated, 'hourly_rate' => $hourly ? $validated['hourly_rate'] : null];
    }
}

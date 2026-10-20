<?php

namespace App\Http\Controllers;

use App\Enums\PieceUnit;
use App\Models\PieceRate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PieceRateController extends Controller
{
    /**
     * Contract jobs and their current rates.
     */
    public function index(): Response
    {
        return Inertia::render('piece-rates/index', [
            'rates' => PieceRate::ordered()->get(),
            'units' => PieceUnit::options(),
        ]);
    }

    /**
     * Add a job.
     */
    public function store(Request $request): RedirectResponse
    {
        PieceRate::create($this->validated($request));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Job rate saved.')]);

        return to_route('piece-rates.index');
    }

    /**
     * Change a job's rate. Work already recorded keeps the rate it was recorded at.
     */
    public function update(Request $request, PieceRate $pieceRate): RedirectResponse
    {
        $pieceRate->update($this->validated($request, $pieceRate));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Job rate saved.')]);

        return to_route('piece-rates.index');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?PieceRate $rate = null): array
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique(PieceRate::class)->ignore($rate?->id)],
            'unit' => ['required', Rule::enum(PieceUnit::class)],
            'rate' => ['required', 'numeric', 'gt:0', 'max:99999'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'is_active' => ['boolean'],
        ]);

        return [...$validated, 'sort_order' => $validated['sort_order'] ?? 0];
    }
}

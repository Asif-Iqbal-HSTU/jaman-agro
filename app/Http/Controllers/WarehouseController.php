<?php

namespace App\Http\Controllers;

use App\Models\Warehouse;
use App\Support\Decimal;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class WarehouseController extends Controller
{
    /**
     * The auction warehouses, with how much of the factory's tea waits in each.
     */
    public function index(): Response
    {
        $warehouses = Warehouse::query()
            ->withSum(['invoices as waiting_kg' => fn ($q) => $q->whereNull('price_per_kg')], 'net_kg')
            ->withCount(['invoices as waiting_count' => fn ($q) => $q->whereNull('price_per_kg')])
            ->orderBy('name')
            ->get()
            ->map(fn (Warehouse $w) => [
                ...$w->toArray(),
                'waiting_kg' => Decimal::add($w->getAttribute('waiting_kg')),
                'waiting_count' => (int) $w->getAttribute('waiting_count'),
            ]);

        return Inertia::render('warehouses/index', ['warehouses' => $warehouses]);
    }

    /**
     * Add a warehouse.
     */
    public function store(Request $request): RedirectResponse
    {
        Warehouse::create($this->validated($request));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Warehouse saved.')]);

        return to_route('warehouses.index');
    }

    /**
     * Update or switch off a warehouse.
     */
    public function update(Request $request, Warehouse $warehouse): RedirectResponse
    {
        $warehouse->update($this->validated($request, $warehouse));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Warehouse saved.')]);

        return to_route('warehouses.index');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?Warehouse $warehouse = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique(Warehouse::class)->ignore($warehouse?->id)],
            'location' => ['nullable', 'string', 'max:255'],
            'is_active' => ['boolean'],
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use App\Enums\DeliveryMode;
use App\Models\Vehicle;
use App\Support\Decimal;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class VehicleController extends Controller
{
    /**
     * The factory's own vehicles, with this month's leaf collected and running costs.
     */
    public function index(): Response
    {
        $monthStart = Date::today()->startOfMonth();

        $vehicles = Vehicle::query()
            ->withSum(['leafReceipts as leaf_kg' => fn ($q) => $q
                ->where('delivery_mode', DeliveryMode::FactoryVehicle)
                ->whereDate('received_on', '>=', $monthStart)], 'net_kg')
            ->withSum(['expenses as cost' => fn ($q) => $q->whereDate('spent_on', '>=', $monthStart)], 'amount')
            ->orderBy('name')
            ->get()
            ->map(fn (Vehicle $v) => [
                ...$v->toArray(),
                'leaf_kg' => Decimal::add($v->getAttribute('leaf_kg')),
                'cost' => Decimal::add($v->getAttribute('cost')),
            ]);

        return Inertia::render('vehicles/index', ['vehicles' => $vehicles]);
    }

    /**
     * Add a vehicle.
     */
    public function store(Request $request): RedirectResponse
    {
        Vehicle::create($this->validated($request));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Vehicle saved.')]);

        return to_route('vehicles.index');
    }

    /**
     * Update or switch off a vehicle.
     */
    public function update(Request $request, Vehicle $vehicle): RedirectResponse
    {
        $vehicle->update($this->validated($request, $vehicle));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Vehicle saved.')]);

        return to_route('vehicles.index');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?Vehicle $vehicle = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'registration_no' => ['nullable', 'string', 'max:30', Rule::unique(Vehicle::class)->ignore($vehicle?->id)],
            'driver_name' => ['nullable', 'string', 'max:255'],
            'driver_phone' => ['nullable', 'string', 'max:20'],
            'is_active' => ['boolean'],
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use App\Enums\DeductionType;
use App\Enums\DeliveryMode;
use App\Http\Requests\Leaf\LeafReceiptRequest;
use App\Models\LeafRate;
use App\Models\LeafReceipt;
use App\Models\Supplier;
use App\Models\Vehicle;
use App\Support\Decimal;
use App\Support\EditLock;
use Carbon\CarbonInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Inertia\Inertia;
use Inertia\Response;

class LeafReceiptController extends Controller
{
    /**
     * Show one day's green leaf deliveries and the rates for that day.
     */
    public function index(Request $request): Response
    {
        $date = $this->dateFrom($request);
        $rate = LeafRate::forDate($date);

        $receipts = LeafReceipt::query()
            ->with('supplier:id,code,name', 'vehicle:id,name')
            ->whereDate('received_on', $date)
            ->orderBy('id')
            ->get();

        return Inertia::render('leaf-receipts/index', [
            'date' => $date->toDateString(),
            'today' => Date::today()->toDateString(),
            'rate' => $rate?->rate,
            'siteRate' => $rate?->site_rate,
            'rateLock' => $rate?->edit_lock,
            'rateId' => $rate?->id,
            'receipts' => $receipts,
            'totals' => [
                'count' => $receipts->count(),
                'gross_kg' => Decimal::add(...$receipts->pluck('gross_kg')->all()),
                'deduction_kg' => Decimal::add(...$receipts->pluck('deduction_kg')->all()),
                'net_kg' => Decimal::add(...$receipts->pluck('net_kg')->all()),
                'amount' => Decimal::add(...$receipts->pluck('amount')->all()),
                'suppliers' => $receipts->pluck('supplier_id')->unique()->count(),
                'factory_vehicle_kg' => Decimal::add(...$receipts->where('delivery_mode', DeliveryMode::FactoryVehicle)->pluck('net_kg')->all()),
            ],
        ]);
    }

    /**
     * Show the gate entry form.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('leaf-receipts/create', [
            ...$this->formOptions(),
            'date' => $this->dateFrom($request)->toDateString(),
            'supplierId' => $request->integer('supplier') ?: null,
        ]);
    }

    /**
     * Record a delivery.
     */
    public function store(LeafReceiptRequest $request): RedirectResponse
    {
        $receipt = LeafReceipt::create([...$request->receiptData(), 'recorded_by' => $request->user()->id]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Delivery :number saved: :kg kg net.', ['number' => $receipt->number, 'kg' => $receipt->net_kg]),
        ]);

        if ($request->boolean('add_another')) {
            return to_route('leaf-receipts.create', ['date' => $receipt->received_on->toDateString()]);
        }

        return to_route('leaf-receipts.show', $receipt);
    }

    /**
     * Show a printable weighing slip.
     */
    public function show(LeafReceipt $leafReceipt): Response
    {
        return Inertia::render('leaf-receipts/show', [
            'receipt' => $leafReceipt->load('supplier:id,code,name,garden_name,phone', 'recorder:id,name', 'vehicle:id,name'),
        ]);
    }

    /**
     * Show the form for correcting a delivery.
     */
    public function edit(LeafReceipt $leafReceipt): Response
    {
        EditLock::ensureEditable($leafReceipt);

        return Inertia::render('leaf-receipts/edit', [
            ...$this->formOptions($leafReceipt->supplier_id, $leafReceipt->vehicle_id),
            'receipt' => $leafReceipt,
        ]);
    }

    /**
     * Correct a delivery.
     */
    public function update(LeafReceiptRequest $request, LeafReceipt $leafReceipt): RedirectResponse
    {
        EditLock::ensureEditable($leafReceipt);

        $leafReceipt->update($request->receiptData());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Delivery updated.')]);

        return to_route('leaf-receipts.index', ['date' => $leafReceipt->received_on->toDateString()]);
    }

    /**
     * Remove a delivery that was entered by mistake.
     */
    public function destroy(LeafReceipt $leafReceipt): RedirectResponse
    {
        EditLock::ensureEditable($leafReceipt);

        $date = $leafReceipt->received_on->toDateString();

        $leafReceipt->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Delivery deleted.')]);

        return to_route('leaf-receipts.index', ['date' => $date]);
    }

    /**
     * The day requested in the query string, or today.
     */
    private function dateFrom(Request $request): CarbonInterface
    {
        $request->validate(['date' => ['nullable', 'date', 'before_or_equal:today']]);

        return $request->filled('date') ? Date::parse($request->string('date')->toString()) : Date::today();
    }

    /**
     * Suppliers, vehicles and recent rates for the entry form.
     *
     * @return array<string, mixed>
     */
    private function formOptions(?int $includeSupplierId = null, ?int $includeVehicleId = null): array
    {
        return [
            // Active suppliers, plus the one already on the receipt even if it has since been deactivated.
            'suppliers' => Supplier::query()
                ->where(fn ($query) => $query->where('is_active', true)->orWhere('id', $includeSupplierId))
                ->orderBy('name')
                ->get(['id', 'code', 'name', 'garden_name']),
            'vehicles' => Vehicle::query()
                ->where(fn ($query) => $query->where('is_active', true)->orWhere('id', $includeVehicleId))
                ->orderBy('name')
                ->get(['id', 'name', 'registration_no']),
            'rates' => LeafRate::query()
                ->whereDate('rate_date', '>=', Date::today()->subDays(60))
                ->get()
                ->mapWithKeys(fn (LeafRate $rate) => [$rate->rate_date->toDateString() => [
                    'rate' => $rate->rate,
                    'site_rate' => $rate->site_rate,
                ]]),
            'deliveryModes' => DeliveryMode::options(),
            'deductionTypes' => DeductionType::options(),
        ];
    }
}

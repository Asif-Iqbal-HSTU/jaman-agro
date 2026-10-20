<?php

namespace App\Http\Controllers;

use App\Enums\PaymentMethod;
use App\Enums\PaymentType;
use App\Http\Requests\Leaf\SupplierPaymentRequest;
use App\Models\Supplier;
use App\Models\SupplierPayment;
use App\Support\Decimal;
use App\Support\EditLock;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SupplierPaymentController extends Controller
{
    /**
     * List payments and advances for a period.
     */
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'supplier' => ['nullable', 'integer'],
            'type' => ['nullable', Rule::enum(PaymentType::class)],
        ]);

        $from = isset($validated['from']) ? Date::parse($validated['from']) : Date::today()->startOfMonth();
        $to = isset($validated['to']) ? Date::parse($validated['to']) : Date::today();

        $query = SupplierPayment::query()
            ->whereDate('paid_on', '>=', $from)->whereDate('paid_on', '<=', $to)
            ->when($validated['supplier'] ?? null, fn ($query, $id) => $query->where('supplier_id', $id))
            ->when($validated['type'] ?? null, fn ($query, $type) => $query->where('type', $type));

        $totals = (clone $query)
            ->selectRaw('type, SUM(amount) as total')
            ->groupBy('type')
            ->pluck('total', 'type');

        return Inertia::render('supplier-payments/index', [
            'payments' => $query->with('supplier:id,code,name')
                ->orderByDesc('paid_on')->orderByDesc('id')
                ->paginate(30)
                ->withQueryString(),
            'totals' => [
                'advance' => Decimal::add($totals[PaymentType::Advance->value] ?? 0),
                'payment' => Decimal::add($totals[PaymentType::Payment->value] ?? 0),
            ],
            'filters' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
                'supplier' => $validated['supplier'] ?? null,
                'type' => $validated['type'] ?? null,
            ],
            'suppliers' => Supplier::orderBy('name')->get(['id', 'code', 'name']),
            ...$this->options(),
        ]);
    }

    /**
     * Show the form for recording a payment.
     */
    public function create(Request $request): Response
    {
        $supplierId = $request->integer('supplier') ?: null;
        $supplier = $supplierId ? Supplier::withBalance()->find($supplierId) : null;

        return Inertia::render('supplier-payments/create', [
            'suppliers' => Supplier::where('is_active', true)->orderBy('name')->get(['id', 'code', 'name']),
            'supplierId' => $supplier?->id,
            'balance' => $supplier?->balance(),
            'today' => Date::today()->toDateString(),
            ...$this->options(),
        ]);
    }

    /**
     * Record a payment or advance.
     */
    public function store(SupplierPaymentRequest $request): RedirectResponse
    {
        $payment = SupplierPayment::create([...$request->validated(), 'recorded_by' => $request->user()->id]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Payment recorded.')]);

        return to_route('suppliers.show', $payment->supplier_id);
    }

    /**
     * Show the form for correcting a payment.
     */
    public function edit(SupplierPayment $supplierPayment): Response
    {
        EditLock::ensureEditable($supplierPayment);

        return Inertia::render('supplier-payments/edit', [
            'payment' => $supplierPayment,
            'suppliers' => Supplier::orderBy('name')->get(['id', 'code', 'name']),
            ...$this->options(),
        ]);
    }

    /**
     * Correct a payment.
     */
    public function update(SupplierPaymentRequest $request, SupplierPayment $supplierPayment): RedirectResponse
    {
        EditLock::ensureEditable($supplierPayment);

        $supplierPayment->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Payment updated.')]);

        return to_route('suppliers.show', $supplierPayment->supplier_id);
    }

    /**
     * Remove a payment entered by mistake.
     */
    public function destroy(SupplierPayment $supplierPayment): RedirectResponse
    {
        EditLock::ensureEditable($supplierPayment);

        $supplierPayment->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Payment deleted.')]);

        return to_route('supplier-payments.index');
    }

    /**
     * @return array{types: list<array{value: string, label: string}>, methods: list<array{value: string, label: string}>}
     */
    private function options(): array
    {
        return ['types' => PaymentType::options(), 'methods' => PaymentMethod::options()];
    }
}

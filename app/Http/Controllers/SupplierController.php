<?php

namespace App\Http\Controllers;

use App\Http\Requests\Leaf\SupplierRequest;
use App\Models\Supplier;
use App\Services\SupplierStatement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Inertia\Inertia;
use Inertia\Response;

class SupplierController extends Controller
{
    /**
     * List suppliers with what the factory currently owes each of them.
     */
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();
        $status = $request->string('status')->toString();

        $suppliers = Supplier::query()
            ->withBalance()
            ->withSum('leafReceipts as leaf_kg', 'net_kg')
            ->when($search !== '', fn ($query) => $query->where(
                fn ($query) => $query
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('garden_name', 'like', "%{$search}%"),
            ))
            ->when($status === 'active', fn ($query) => $query->where('is_active', true))
            ->when($status === 'inactive', fn ($query) => $query->where('is_active', false))
            ->orderBy('name')
            ->paginate(25)
            ->withQueryString()
            ->through(fn (Supplier $supplier) => [
                ...$supplier->only('id', 'code', 'name', 'phone', 'garden_name', 'is_active'),
                'leaf_kg' => $supplier->getAttribute('leaf_kg') ?? '0.00',
                'balance' => $supplier->balance(),
            ]);

        return Inertia::render('suppliers/index', [
            'suppliers' => $suppliers,
            'filters' => ['search' => $search, 'status' => $status],
            'summary' => Supplier::balanceSummary(),
        ]);
    }

    /**
     * Show the form for adding a supplier.
     */
    public function create(): Response
    {
        return Inertia::render('suppliers/create');
    }

    /**
     * Add a supplier.
     */
    public function store(SupplierRequest $request): RedirectResponse
    {
        $supplier = Supplier::create($request->supplierData());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Supplier added.')]);

        return to_route('suppliers.show', $supplier);
    }

    /**
     * Show a supplier's account statement for a period.
     */
    public function show(Request $request, Supplier $supplier): Response
    {
        $validated = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);

        $from = isset($validated['from']) ? Date::parse($validated['from']) : Date::today()->startOfMonth();
        $to = isset($validated['to']) ? Date::parse($validated['to']) : Date::today();

        $supplier->loadSum('leafReceipts as leaf_amount', 'amount')->loadSum('payments as paid_amount', 'amount');

        return Inertia::render('suppliers/show', [
            'supplier' => [...$supplier->toArray(), 'balance' => $supplier->balance()],
            'statement' => SupplierStatement::for($supplier, $from, $to),
            'filters' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
        ]);
    }

    /**
     * Show the form for editing a supplier.
     */
    public function edit(Supplier $supplier): Response
    {
        return Inertia::render('suppliers/edit', [
            'supplier' => $supplier,
        ]);
    }

    /**
     * Update a supplier.
     */
    public function update(SupplierRequest $request, Supplier $supplier): RedirectResponse
    {
        $supplier->update($request->supplierData());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Supplier updated.')]);

        return to_route('suppliers.show', $supplier);
    }
}

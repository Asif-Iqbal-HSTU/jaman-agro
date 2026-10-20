<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Services\CustomerStatement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    /**
     * Retail customers and what each owes the factory.
     */
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();

        $customers = Customer::query()
            ->withBalance()
            ->when($search !== '', fn ($query) => $query->where(fn ($query) => $query
                ->where('name', 'like', "%{$search}%")
                ->orWhere('phone', 'like', "%{$search}%")))
            ->orderBy('name')
            ->paginate(25)
            ->withQueryString()
            ->through(fn (Customer $customer) => [
                ...$customer->only('id', 'name', 'phone', 'address', 'is_active'),
                'sales_amount' => $customer->sales_amount ?? '0.00',
                'balance' => $customer->balance(),
            ]);

        return Inertia::render('customers/index', [
            'customers' => $customers,
            'filters' => ['search' => $search],
            'receivable' => Customer::totalReceivable(),
        ]);
    }

    /**
     * Show the form for adding a customer.
     */
    public function create(): Response
    {
        return Inertia::render('customers/create');
    }

    /**
     * Add a customer.
     */
    public function store(Request $request): RedirectResponse
    {
        $customer = Customer::create($this->validated($request));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Customer added.')]);

        return to_route('customers.show', $customer);
    }

    /**
     * A customer's account statement for a period.
     */
    public function show(Request $request, Customer $customer): Response
    {
        $validated = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);

        $from = isset($validated['from']) ? Date::parse($validated['from']) : Date::today()->startOfMonth();
        $to = isset($validated['to']) ? Date::parse($validated['to']) : Date::today();

        $customer->loadSum('sales as sales_amount', 'total_amount')->loadSum('payments as paid_amount', 'amount');

        return Inertia::render('customers/show', [
            'customer' => [...$customer->toArray(), 'balance' => $customer->balance()],
            'statement' => CustomerStatement::for($customer, $from, $to),
            'filters' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
        ]);
    }

    /**
     * Show the form for editing a customer.
     */
    public function edit(Customer $customer): Response
    {
        return Inertia::render('customers/edit', ['customer' => $customer]);
    }

    /**
     * Update a customer.
     */
    public function update(Request $request, Customer $customer): RedirectResponse
    {
        $customer->update($this->validated($request));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Customer updated.')]);

        return to_route('customers.show', $customer);
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:255'],
            'opening_balance' => ['nullable', 'numeric', 'between:-99999999,99999999'],
            'is_active' => ['boolean'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        return [...$validated, 'opening_balance' => $validated['opening_balance'] ?? 0];
    }
}

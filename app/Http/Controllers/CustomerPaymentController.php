<?php

namespace App\Http\Controllers;

use App\Enums\PaymentMethod;
use App\Models\Customer;
use App\Models\CustomerPayment;
use App\Support\EditLock;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CustomerPaymentController extends Controller
{
    /**
     * Show the form for receiving money from a customer.
     */
    public function create(Request $request): Response
    {
        $customerId = $request->integer('customer') ?: null;
        $customer = $customerId ? Customer::withBalance()->find($customerId) : null;

        return Inertia::render('customer-payments/create', [
            'customers' => Customer::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'customerId' => $customer?->id,
            'balance' => $customer?->balance(),
            'methods' => PaymentMethod::options(),
            'today' => Date::today()->toDateString(),
        ]);
    }

    /**
     * Record money received from a customer.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'paid_on' => ['required', 'date', 'before_or_equal:today'],
            'customer_id' => ['required', 'integer', Rule::exists(Customer::class, 'id')],
            'amount' => ['required', 'numeric', 'gt:0', 'max:99999999'],
            'method' => ['required', Rule::enum(PaymentMethod::class)],
            'reference' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        $payment = CustomerPayment::create([...$validated, 'recorded_by' => $request->user()->id]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Payment received.')]);

        return to_route('customers.show', $payment->customer_id);
    }

    /**
     * Remove a payment entered by mistake. Money taken with a sale goes with the sale.
     */
    public function destroy(CustomerPayment $customerPayment): RedirectResponse
    {
        EditLock::ensureEditable($customerPayment);

        if ($customerPayment->retail_sale_id !== null) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('This payment belongs to a sale. Cancel the sale instead.')]);

            return back();
        }

        $customerId = $customerPayment->customer_id;
        $customerPayment->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Payment deleted.')]);

        return to_route('customers.show', $customerId);
    }
}

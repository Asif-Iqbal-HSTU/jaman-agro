<?php

namespace App\Http\Requests\Sales;

use App\Enums\PackageType;
use App\Models\AuctionInvoice;
use App\Models\Broker;
use App\Models\TeaGrade;
use App\Models\Warehouse;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class AuctionInvoiceRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $invoice = $this->route('auction_invoice');

        return [
            'invoice_no' => [
                'required', 'string', 'max:30',
                Rule::unique(AuctionInvoice::class)->ignore($invoice instanceof AuctionInvoice ? $invoice->id : null),
            ],
            'packed_on' => ['required', 'date', 'before_or_equal:today'],
            'tea_grade_id' => ['required', 'integer', Rule::exists(TeaGrade::class, 'id')],
            'package_type' => ['required', Rule::enum(PackageType::class)],
            'packages' => ['required', 'integer', 'min:1', 'max:10000'],
            'kg_per_package' => ['required', 'numeric', 'gt:0', 'max:1000'],
            'broker_id' => ['nullable', 'integer', Rule::exists(Broker::class, 'id')],
            'warehouse_id' => ['nullable', 'integer', Rule::exists(Warehouse::class, 'id')],
            'auction_centre' => ['nullable', 'string', 'max:50'],
            'sale_no' => ['nullable', 'string', 'max:20'],
            'lot_no' => ['nullable', 'string', 'max:20'],
            'dispatched_on' => ['nullable', 'date', 'after_or_equal:packed_on', 'before_or_equal:today'],
            'sold_on' => ['nullable', 'required_with:price_per_kg', 'date', 'after_or_equal:packed_on', 'before_or_equal:today'],
            'buyer' => ['nullable', 'string', 'max:255'],
            'price_per_kg' => ['nullable', 'required_with:sold_on', 'numeric', 'gt:0', 'max:99999'],
            'deductions' => ['nullable', 'numeric', 'min:0', 'max:99999999'],
            'paid_on' => ['nullable', 'date', 'after_or_equal:sold_on', 'before_or_equal:today'],
            'payment_reference' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * Money can only be received for an invoice that has been sold.
     *
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($this->filled('paid_on') && ! $this->filled('price_per_kg')) {
                    $validator->errors()->add('paid_on', __('Record the auction price before the payment.'));
                }
            },
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function invoiceData(): array
    {
        return [...$this->validated(), 'deductions' => $this->validated('deductions') ?? 0];
    }
}

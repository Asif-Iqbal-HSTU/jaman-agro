<?php

namespace App\Http\Requests\Sales;

use App\Enums\PaymentMethod;
use App\Models\Customer;
use App\Models\TeaGrade;
use App\Support\Decimal;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class RetailSaleRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'sold_on' => ['required', 'date', 'before_or_equal:today'],
            'customer_id' => ['nullable', 'integer', Rule::exists(Customer::class, 'id')],
            'items' => ['required', 'array', 'min:1'],
            'items.*.tea_grade_id' => ['required', 'integer', 'distinct', Rule::exists(TeaGrade::class, 'id')],
            'items.*.kg' => ['required', 'numeric', 'gt:0', 'max:99999'],
            'items.*.rate' => ['required', 'numeric', 'gt:0', 'max:99999'],
            'paid_amount' => ['nullable', 'numeric', 'min:0', 'max:99999999'],
            'method' => ['required', Rule::enum(PaymentMethod::class)],
            'reference' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * A walk-in sale has nobody to owe the money, so it must be paid in full.
     *
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($validator->errors()->isNotEmpty() || $this->filled('customer_id')) {
                    return;
                }

                if (Decimal::compare($this->input('paid_amount'), $this->total()) !== 0) {
                    $validator->errors()->add('paid_amount', __('A sale without a customer must be paid in full.'));
                }
            },
        ];
    }

    /**
     * The value of all lines on the memo.
     *
     * @return numeric-string
     */
    public function total(): string
    {
        $lines = [];

        foreach ((array) $this->input('items', []) as $item) {
            $lines[] = Decimal::mul($item['kg'] ?? 0, $item['rate'] ?? 0);
        }

        return Decimal::add(...$lines);
    }

    /**
     * @return list<array{tea_grade_id: int, kg: string, rate: string}>
     */
    public function items(): array
    {
        $items = [];

        foreach ((array) $this->validated('items') as $item) {
            $items[] = [
                'tea_grade_id' => (int) $item['tea_grade_id'],
                'kg' => (string) $item['kg'],
                'rate' => (string) $item['rate'],
            ];
        }

        return $items;
    }

    /**
     * @return array{amount: string, method: string, reference: string|null}|null
     */
    public function payment(): ?array
    {
        $amount = $this->validated('paid_amount');

        if (! is_numeric($amount)) {
            return null;
        }

        return [
            'amount' => (string) $amount,
            'method' => (string) $this->validated('method'),
            'reference' => $this->validated('reference'),
        ];
    }
}

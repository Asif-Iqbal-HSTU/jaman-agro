<?php

namespace App\Http\Requests\Leaf;

use App\Models\Supplier;
use App\Support\Decimal;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SupplierRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $supplier = $this->route('supplier');

        return [
            'code' => [
                'nullable', 'string', 'max:20',
                Rule::unique(Supplier::class)->ignore($supplier instanceof Supplier ? $supplier->id : null),
            ],
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'garden_name' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'opening_type' => ['nullable', Rule::in([self::PAYABLE, self::ADVANCE])],
            'opening_amount' => ['nullable', 'numeric', 'min:0', 'max:99999999'],
            'is_active' => ['boolean'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public const PAYABLE = 'payable';

    public const ADVANCE = 'advance';

    /**
     * The supplier's details, with the opening balance signed: what the factory
     * owes is positive, an advance the supplier still has to cover is negative.
     *
     * @return array<string, mixed>
     */
    public function supplierData(): array
    {
        $data = collect($this->validated())->except('opening_type', 'opening_amount')->all();
        $amount = $this->validated('opening_amount') ?? 0;

        return [
            ...$data,
            'opening_balance' => $this->validated('opening_type') === self::ADVANCE ? Decimal::sub(0, $amount) : Decimal::add($amount),
        ];
    }
}

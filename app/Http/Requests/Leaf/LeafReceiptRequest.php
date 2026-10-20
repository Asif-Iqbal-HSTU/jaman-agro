<?php

namespace App\Http\Requests\Leaf;

use App\Enums\DeductionType;
use App\Enums\DeliveryMode;
use App\Models\Supplier;
use App\Models\Vehicle;
use App\Support\Decimal;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class LeafReceiptRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'received_on' => ['required', 'date', 'before_or_equal:today'],
            'supplier_id' => ['required', 'integer', Rule::exists(Supplier::class, 'id')],
            'delivery_mode' => ['required', Rule::enum(DeliveryMode::class)],
            'vehicle_id' => ['nullable', 'required_if:delivery_mode,'.DeliveryMode::FactoryVehicle->value, 'integer', Rule::exists(Vehicle::class, 'id')],
            'vehicle_no' => ['nullable', 'string', 'max:30'],
            'gross_kg' => ['required', 'numeric', 'gt:0', 'max:99999'],
            'tare_kg' => ['nullable', 'numeric', 'min:0', 'lt:gross_kg'],
            'deduction_type' => ['required', Rule::enum(DeductionType::class)],
            'deduction_value' => ['required', 'numeric', 'min:0', 'max:99999'],
            'notes' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * A percentage stays within 100; a kg deduction cannot be more than the leaf itself.
     *
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                $value = $this->input('deduction_value');

                if ($this->input('deduction_type') === DeductionType::Percent->value && Decimal::compare($value, 100) > 0) {
                    $validator->errors()->add('deduction_value', __('A percentage cannot be more than 100.'));
                }

                $leafKg = Decimal::sub($this->input('gross_kg'), $this->input('tare_kg') ?? 0);

                if ($this->input('deduction_type') === DeductionType::Kg->value && Decimal::compare($value, $leafKg) >= 0) {
                    $validator->errors()->add('deduction_value', __('The deduction must be less than the leaf weight (:kg kg).', ['kg' => $leafKg]));
                }
            },
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function receiptData(): array
    {
        $data = $this->safe()->except('deduction_value');
        $value = (string) $this->validated('deduction_value');
        $isPercent = $data['deduction_type'] === DeductionType::Percent->value;

        return [
            ...$data,
            'tare_kg' => $data['tare_kg'] ?? 0,
            'vehicle_id' => $data['delivery_mode'] === DeliveryMode::FactoryVehicle->value ? $data['vehicle_id'] : null,
            'deduction_percent' => $isPercent ? $value : null,
            'deduction_kg' => $isPercent ? 0 : $value,
        ];
    }
}

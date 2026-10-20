<?php

namespace App\Http\Requests\Leaf;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class LeafRateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'rate_date' => ['required', 'date', 'before_or_equal:today'],
            // Price for leaf the supplier brings to the factory.
            'rate' => ['required', 'numeric', 'gt:0', 'max:9999'],
            // Lower price for leaf a factory vehicle collects at the garden.
            'site_rate' => ['nullable', 'numeric', 'gt:0', 'lte:rate'],
        ];
    }
}

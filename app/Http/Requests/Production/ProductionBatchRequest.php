<?php

namespace App\Http\Requests\Production;

use App\Models\TeaGrade;
use App\Support\Decimal;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class ProductionBatchRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'produced_on' => ['required', 'date', 'before_or_equal:today'],
            'green_leaf_kg' => ['required', 'numeric', 'gt:0', 'max:999999'],
            'withering_hours' => ['nullable', 'numeric', 'min:0', 'max:99'],
            'fermentation_minutes' => ['nullable', 'integer', 'min:0', 'max:600'],
            'dryer_temp_c' => ['nullable', 'integer', 'min:0', 'max:300'],
            'notes' => ['nullable', 'string', 'max:255'],
            'outputs' => ['required', 'array'],
            'outputs.*' => ['nullable', 'numeric', 'min:0', 'max:999999'],
        ];
    }

    /**
     * Outputs must be for known grades, and at least one grade must have tea.
     *
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                $outputs = $this->input('outputs', []);

                if (! is_array($outputs) || $validator->errors()->isNotEmpty()) {
                    return;
                }

                $known = TeaGrade::whereIn('id', array_keys($outputs))->count();

                if ($known !== count($outputs)) {
                    $validator->errors()->add('outputs', __('Unknown tea grade.'));
                }

                if (collect($outputs)->every(fn ($kg) => Decimal::compare($kg, 0) <= 0)) {
                    $validator->errors()->add('outputs', __('Enter the made tea of at least one grade.'));
                }
            },
        ];
    }

    /**
     * The batch's own columns.
     *
     * @return array<string, mixed>
     */
    public function batchData(): array
    {
        return $this->safe()->except('outputs');
    }

    /**
     * Made tea kg keyed by grade id.
     *
     * @return array<int, string|null>
     */
    public function outputs(): array
    {
        $outputs = [];

        foreach ((array) $this->validated('outputs') as $gradeId => $kg) {
            $outputs[(int) $gradeId] = is_numeric($kg) ? (string) $kg : null;
        }

        return $outputs;
    }
}

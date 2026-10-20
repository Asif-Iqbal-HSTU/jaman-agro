<?php

namespace Database\Factories;

use App\Models\LeafReceipt;
use App\Models\Supplier;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LeafReceipt>
 */
class LeafReceiptFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'received_on' => today(),
            'supplier_id' => Supplier::factory(),
            'gross_kg' => fake()->randomFloat(2, 50, 800),
            'tare_kg' => 0,
            'deduction_type' => 'percent',
            'deduction_percent' => 5,
        ];
    }
}

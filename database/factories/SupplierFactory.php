<?php

namespace Database\Factories;

use App\Models\Supplier;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Supplier>
 */
class SupplierFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'phone' => '01'.fake()->numerify('#########'),
            'garden_name' => fake()->lastName().' Garden',
            'address' => fake()->city(),
            'opening_balance' => 0,
            'is_active' => true,
        ];
    }
}

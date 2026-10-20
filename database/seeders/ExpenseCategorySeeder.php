<?php

namespace Database\Seeders;

use App\Enums\ExpenseKind;
use App\Models\ExpenseCategory;
use Illuminate\Database\Seeder;

class ExpenseCategorySeeder extends Seeder
{
    /**
     * The running costs of a bought-leaf factory, in the two groups the manager
     * keeps apart: the factory itself and its vehicles. Editable in the app.
     */
    public function run(): void
    {
        $categories = [
            ['Fuel (gas, coal)', ExpenseKind::Factory],
            ['Electricity', ExpenseKind::Factory],
            ['Wages & salaries', ExpenseKind::Factory],
            ['Repairs & maintenance', ExpenseKind::Factory],
            ['Machine parts', ExpenseKind::Factory],
            ['Packing materials', ExpenseKind::Factory],
            ['Load / unload', ExpenseKind::Factory],
            ['Truck hire', ExpenseKind::Factory],
            ['Transport', ExpenseKind::Factory],
            ['Food & entertainment', ExpenseKind::Factory],
            ['Donations & local payments', ExpenseKind::Factory],
            ['Office & admin', ExpenseKind::Factory],
            ['Other', ExpenseKind::Factory],
            ['Vehicle fuel (petrol, diesel)', ExpenseKind::Vehicle],
            ['Driver salary', ExpenseKind::Vehicle],
            ['Vehicle repairs', ExpenseKind::Vehicle],
        ];

        foreach ($categories as $order => [$name, $kind]) {
            ExpenseCategory::firstOrCreate(['name' => $name], ['kind' => $kind, 'sort_order' => ($order + 1) * 10]);
        }
    }
}

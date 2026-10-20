<?php

namespace Database\Seeders;

use App\Enums\PieceUnit;
use App\Models\PieceRate;
use Illuminate\Database\Seeder;

class PieceRateSeeder extends Seeder
{
    /**
     * Contract jobs and rates as discussed with the manager on 1 June 2026.
     * The rates came from a recording and should be checked; the manager
     * can change them at any time in the app.
     */
    public function run(): void
    {
        $jobs = [
            ['Leaf unloading & trough work', PieceUnit::Kg, '0.45'],
            ['Bagging', PieceUnit::Bag, '8.00'],
            ['Stacking (খামাল)', PieceUnit::Bag, '3.00'],
            ['Sewing bags', PieceUnit::Bag, '3.00'],
            ['Loading bags', PieceUnit::Bag, '8.00'],
            ['Coal unloading', PieceUnit::Ton, '30.00'],
        ];

        foreach ($jobs as $order => [$name, $unit, $rate]) {
            PieceRate::firstOrCreate(['name' => $name], ['unit' => $unit, 'rate' => $rate, 'sort_order' => ($order + 1) * 10]);
        }
    }
}

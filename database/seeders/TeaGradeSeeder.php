<?php

namespace Database\Seeders;

use App\Models\TeaGrade;
use Illuminate\Database\Seeder;

class TeaGradeSeeder extends Seeder
{
    /**
     * The usual CTC grades. The manager can rename, add or switch these off in the app.
     */
    public function run(): void
    {
        $grades = [
            ['code' => 'BP', 'name' => 'Broken Pekoe'],
            ['code' => 'BOP', 'name' => 'Broken Orange Pekoe'],
            ['code' => 'OF', 'name' => 'Orange Fannings'],
            ['code' => 'PF', 'name' => 'Pekoe Fannings'],
            ['code' => 'PD', 'name' => 'Pekoe Dust'],
            ['code' => 'D', 'name' => 'Dust'],
            ['code' => 'CD', 'name' => 'Churamani Dust'],
            ['code' => 'RD', 'name' => 'Red Dust'],
        ];

        foreach ($grades as $order => $grade) {
            TeaGrade::firstOrCreate(['code' => $grade['code']], [...$grade, 'sort_order' => ($order + 1) * 10]);
        }
    }
}

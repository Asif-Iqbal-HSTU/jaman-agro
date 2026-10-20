<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $accounts = [
            ['name' => 'Asif Iqbal', 'email' => 'admin@jamanagro.com', 'role' => UserRole::Admin, 'locale' => 'en'],
            ['name' => 'Factory Manager', 'email' => 'manager@jamanagro.com', 'role' => UserRole::Manager, 'locale' => 'bn'],
            ['name' => 'Factory Owner', 'email' => 'owner@jamanagro.com', 'role' => UserRole::Owner, 'locale' => 'bn'],
        ];

        foreach ($accounts as $account) {
            $user = User::firstOrNew(['email' => $account['email']]);

            $user->fill([...$account, 'is_active' => true, 'password' => 'password123']);
            $user->email_verified_at ??= now();
            $user->save();
        }

        $this->call([TeaGradeSeeder::class, ExpenseCategorySeeder::class, PieceRateSeeder::class]);
    }
}

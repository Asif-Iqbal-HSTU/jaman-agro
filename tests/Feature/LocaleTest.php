<?php

use App\Models\User;
use Database\Seeders\DatabaseSeeder;

test('guests can switch the language for their session', function () {
    $this->from(route('login'))
        ->put(route('locale.update'), ['locale' => 'bn'])
        ->assertRedirect(route('login'));

    $this->get(route('login'))
        ->assertInertia(fn ($page) => $page
            ->where('locale', 'bn')
            ->where('translations.Log in', 'লগ ইন'));
});

test('signed in users keep their language choice', function () {
    $user = User::factory()->create(['locale' => 'en']);

    $this->actingAs($user)->put(route('locale.update'), ['locale' => 'bn']);

    expect($user->fresh()->locale)->toBe('bn');

    $this->actingAs($user->fresh())
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page->where('locale', 'bn'));
});

test('unsupported languages are rejected', function () {
    $this->put(route('locale.update'), ['locale' => 'fr'])
        ->assertSessionHasErrors('locale');
});

test('the seeder creates one account per role', function () {
    $this->seed(DatabaseSeeder::class);

    expect(User::pluck('role')->map->value->sort()->values()->all())
        ->toBe(['admin', 'manager', 'owner']);

    $this->post(route('login.store'), [
        'email' => 'admin@jamanagro.com',
        'password' => 'password123',
    ])->assertRedirect(route('dashboard', absolute: false));
});

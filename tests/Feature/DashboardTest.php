<?php

use App\Models\LeafRate;
use App\Models\LeafReceipt;
use App\Models\User;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});

test('the dashboard shows the leaf intake of today', function () {
    LeafRate::create(['rate_date' => today(), 'rate' => '15']);
    LeafReceipt::factory()->count(2)->create(['gross_kg' => '100', 'deduction_percent' => '0']);

    $this->actingAs(User::factory()->owner()->create())
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('today.deliveries', 2)
            ->where('today.net_kg', '200.00')
            ->where('today.amount', '3000.00')
            ->where('today.rate', '15.00')
            ->has('week', 7)
            ->where('week.6.net_kg', '200.00'));
});

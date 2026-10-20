<?php

use App\Models\ActivityLog;
use App\Models\Supplier;
use App\Models\SupplierPayment;
use App\Models\User;

test('changes to users are recorded without secrets', function () {
    $admin = User::factory()->admin()->create();
    $this->actingAs($admin);

    $user = User::factory()->create(['name' => 'Before']);
    $user->update(['name' => 'After', 'password' => 'another-password']);

    $log = ActivityLog::where('event', 'updated')->where('subject_id', $user->id)->sole();

    expect($log->user_id)->toBe($admin->id)
        ->and($log->properties['old'])->toBe(['name' => 'Before'])
        ->and($log->properties['attributes'])->toBe(['name' => 'After']);

    $created = ActivityLog::where('event', 'created')->where('subject_id', $user->id)->sole();

    expect($created->properties['attributes'])->not->toHaveKeys(['password', 'remember_token']);
});

test('logins are recorded', function () {
    $user = User::factory()->create();

    $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'password',
    ]);

    expect(ActivityLog::where('event', 'login')->where('user_id', $user->id)->exists())->toBeTrue();
});

test('only admins can view the activity log', function () {
    $this->actingAs(User::factory()->owner()->create())
        ->get(route('admin.activity-log.index'))
        ->assertForbidden();

    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.activity-log.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/activity-log/index'));
});

test('dates are logged as plain dates', function () {
    $this->actingAs(User::factory()->admin()->create());

    $supplier = Supplier::factory()->create();
    $payment = SupplierPayment::create([
        'supplier_id' => $supplier->id,
        'paid_on' => today(),
        'type' => 'payment',
        'method' => 'cash',
        'amount' => '100',
    ]);

    $log = ActivityLog::where('event', 'created')->where('subject_id', $payment->id)->where('subject_type', $payment->getMorphClass())->sole();

    expect($log->properties['attributes']['paid_on'])->toBe(today()->toDateString());
});

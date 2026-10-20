<?php

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('only admins can manage users', function (UserRole $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)->get(route('admin.users.index'))->assertForbidden();
    $this->actingAs($user)->get(route('admin.users.create'))->assertForbidden();
    $this->actingAs($user)->post(route('admin.users.store'), [])->assertForbidden();
})->with([UserRole::Manager, UserRole::Owner]);

test('admins can see the user list', function () {
    $admin = User::factory()->admin()->create();
    User::factory()->count(3)->create();

    $this->actingAs($admin)
        ->get(route('admin.users.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/users/index')
            ->has('users.data', 4)
            ->has('roles', 3));
});

test('admins can create an account with a role', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.users.store'), [
            'name' => 'New Manager',
            'email' => 'new.manager@example.com',
            'role' => 'manager',
            'locale' => 'bn',
            'is_active' => '1',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('admin.users.index'));

    $user = User::where('email', 'new.manager@example.com')->firstOrFail();

    expect($user->role)->toBe(UserRole::Manager)
        ->and($user->locale)->toBe('bn')
        ->and($user->is_active)->toBeTrue()
        ->and($user->email_verified_at)->not->toBeNull()
        ->and(Hash::check('password123', $user->password))->toBeTrue();
});

test('account creation is validated', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.users.store'), [
            'name' => '',
            'email' => $admin->email,
            'role' => 'superuser',
            'locale' => 'fr',
            'password' => 'password123',
            'password_confirmation' => 'different',
        ])
        ->assertSessionHasErrors(['name', 'email', 'role', 'locale', 'password']);
});

test('admins can update an account and leave the password unchanged', function () {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->create();
    $oldHash = $user->password;

    $this->actingAs($admin)
        ->put(route('admin.users.update', $user), [
            'name' => 'Renamed',
            'email' => $user->email,
            'role' => 'owner',
            'locale' => 'en',
            'is_active' => '0',
            'password' => '',
            'password_confirmation' => '',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('admin.users.index'));

    $user->refresh();

    expect($user->name)->toBe('Renamed')
        ->and($user->role)->toBe(UserRole::Owner)
        ->and($user->is_active)->toBeFalse()
        ->and($user->password)->toBe($oldHash);
});

test('admins can reset another account password', function () {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->create();

    $this->actingAs($admin)
        ->put(route('admin.users.update', $user), [
            'name' => $user->name,
            'email' => $user->email,
            'role' => 'manager',
            'locale' => 'en',
            'is_active' => '1',
            'password' => 'brand-new-pass',
            'password_confirmation' => 'brand-new-pass',
        ])
        ->assertSessionHasNoErrors();

    expect(Hash::check('brand-new-pass', $user->fresh()->password))->toBeTrue();
});

test('admins cannot demote or deactivate themselves', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->put(route('admin.users.update', $admin), [
            'name' => $admin->name,
            'email' => $admin->email,
            'role' => 'manager',
            'locale' => 'en',
            'is_active' => '0',
        ])
        ->assertSessionHasErrors(['role', 'is_active']);

    expect($admin->fresh()->isAdmin())->toBeTrue()
        ->and($admin->fresh()->is_active)->toBeTrue();
});

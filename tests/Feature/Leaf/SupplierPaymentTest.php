<?php

use App\Enums\PaymentType;
use App\Enums\UserRole;
use App\Models\Supplier;
use App\Models\SupplierPayment;
use App\Models\User;

test('managers can record a payment', function () {
    $manager = User::factory()->create(['role' => UserRole::Manager]);
    $supplier = Supplier::factory()->create();

    $this->actingAs($manager)
        ->post(route('supplier-payments.store'), [
            'paid_on' => today()->toDateString(),
            'supplier_id' => $supplier->id,
            'type' => 'advance',
            'method' => 'mobile_banking',
            'amount' => '2500.50',
            'reference' => 'TX123',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('suppliers.show', $supplier));

    $payment = SupplierPayment::sole();

    expect($payment->type)->toBe(PaymentType::Advance)
        ->and($payment->amount)->toBe('2500.50')
        ->and($payment->recorded_by)->toBe($manager->id);
});

test('payments are validated', function () {
    $this->actingAs(User::factory()->admin()->create())
        ->post(route('supplier-payments.store'), [
            'paid_on' => 'not a date',
            'supplier_id' => 404,
            'type' => 'gift',
            'method' => 'gold',
            'amount' => '-5',
        ])
        ->assertSessionHasErrors(['paid_on', 'supplier_id', 'type', 'method', 'amount']);
});

test('the payment list totals payments and advances for the period', function () {
    $supplier = Supplier::factory()->create();
    SupplierPayment::create(['supplier_id' => $supplier->id, 'paid_on' => today(), 'type' => 'payment', 'method' => 'cash', 'amount' => '1000']);
    SupplierPayment::create(['supplier_id' => $supplier->id, 'paid_on' => today(), 'type' => 'advance', 'method' => 'cash', 'amount' => '250']);
    SupplierPayment::create(['supplier_id' => $supplier->id, 'paid_on' => today()->subYear(), 'type' => 'payment', 'method' => 'cash', 'amount' => '9999']);

    $this->actingAs(User::factory()->owner()->create())
        ->get(route('supplier-payments.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('payments.data', 2)
            ->where('totals.payment', '1000.00')
            ->where('totals.advance', '250.00'));
});

test('the owner cannot record or delete payments', function () {
    $owner = User::factory()->owner()->create();
    $payment = SupplierPayment::create(['supplier_id' => Supplier::factory()->create()->id, 'paid_on' => today(), 'type' => 'payment', 'method' => 'cash', 'amount' => '10']);

    $this->actingAs($owner)->get(route('supplier-payments.create'))->assertForbidden();
    $this->actingAs($owner)->delete(route('supplier-payments.destroy', $payment))->assertForbidden();
});

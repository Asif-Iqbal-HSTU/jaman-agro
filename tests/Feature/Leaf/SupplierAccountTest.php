<?php

use App\Enums\UserRole;
use App\Models\LeafRate;
use App\Models\LeafReceipt;
use App\Models\Supplier;
use App\Models\SupplierPayment;
use App\Models\User;
use Illuminate\Database\QueryException;

test('managers can add and edit suppliers', function () {
    $manager = User::factory()->create(['role' => UserRole::Manager]);

    $this->actingAs($manager)
        ->post(route('suppliers.store'), [
            'name' => 'Rahim Uddin',
            'code' => 'S-101',
            'garden_name' => 'Uttar Bagan',
            'phone' => '01711000000',
            'opening_type' => 'payable',
            'opening_amount' => '1500',
            'is_active' => '1',
        ])
        ->assertSessionHasNoErrors();

    $supplier = Supplier::sole();

    expect($supplier->opening_balance)->toBe('1500.00');

    $this->actingAs($manager)
        ->put(route('suppliers.update', $supplier), ['name' => 'Rahim Uddin', 'code' => 'S-101', 'is_active' => '0'])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('suppliers.show', $supplier));

    expect($supplier->fresh()->is_active)->toBeFalse()
        ->and($supplier->fresh()->opening_balance)->toBe('0.00');
});

test('an opening advance is entered as a positive amount and kept as money owed to the factory', function () {
    $manager = User::factory()->create(['role' => UserRole::Manager]);

    $this->actingAs($manager)
        ->post(route('suppliers.store'), ['name' => 'Karim Hossain', 'opening_type' => 'advance', 'opening_amount' => '5000', 'is_active' => '1'])
        ->assertSessionHasNoErrors();

    expect(Supplier::sole()->opening_balance)->toBe('-5000.00');
});

test('the opening amount cannot be negative', function () {
    $this->actingAs(User::factory()->create(['role' => UserRole::Manager]))
        ->post(route('suppliers.store'), ['name' => 'Karim Hossain', 'opening_type' => 'payable', 'opening_amount' => '-50', 'is_active' => '1'])
        ->assertSessionHasErrors('opening_amount');

    expect(Supplier::count())->toBe(0);
});

test('supplier codes are unique', function () {
    Supplier::factory()->create(['code' => 'S-1']);

    $this->actingAs(User::factory()->admin()->create())
        ->post(route('suppliers.store'), ['name' => 'Another', 'code' => 'S-1'])
        ->assertSessionHasErrors('code');
});

test('the owner can view suppliers but not change them', function () {
    $owner = User::factory()->owner()->create();
    $supplier = Supplier::factory()->create();

    $this->actingAs($owner)->get(route('suppliers.index'))->assertOk();
    $this->actingAs($owner)->get(route('suppliers.show', $supplier))->assertOk();
    $this->actingAs($owner)->get(route('suppliers.create'))->assertForbidden();
    $this->actingAs($owner)->put(route('suppliers.update', $supplier), ['name' => 'X'])->assertForbidden();
});

test('a balance is opening balance plus leaf value minus payments', function () {
    LeafRate::create(['rate_date' => today(), 'rate' => '20']);
    $supplier = Supplier::factory()->create(['opening_balance' => '500']);
    LeafReceipt::factory()->for($supplier)->create(['gross_kg' => '100', 'deduction_percent' => '0']);
    SupplierPayment::create(['supplier_id' => $supplier->id, 'paid_on' => today(), 'type' => 'payment', 'method' => 'cash', 'amount' => '1200']);

    expect(Supplier::withBalance()->find($supplier->id)->balance())->toBe('1300.00');
});

test('an advance larger than the leaf supplied shows as a negative balance', function () {
    $supplier = Supplier::factory()->create();
    SupplierPayment::create(['supplier_id' => $supplier->id, 'paid_on' => today(), 'type' => 'advance', 'method' => 'cash', 'amount' => '3000']);
    Supplier::factory()->create(['opening_balance' => '800']);

    expect(Supplier::withBalance()->find($supplier->id)->balance())->toBe('-3000.00')
        ->and(Supplier::balanceSummary())->toBe(['payable' => '800.00', 'advances' => '3000.00']);
});

test('the statement carries the earlier balance forward and runs it through the period', function () {
    $supplier = Supplier::factory()->create(['opening_balance' => '100']);

    LeafRate::create(['rate_date' => today()->subDays(10), 'rate' => '10']);
    LeafRate::create(['rate_date' => today()->subDays(2), 'rate' => '20']);
    // Before the period: +1000 leaf, -300 paid.
    LeafReceipt::factory()->for($supplier)->create(['received_on' => today()->subDays(10), 'gross_kg' => '100', 'deduction_percent' => '0']);
    SupplierPayment::create(['supplier_id' => $supplier->id, 'paid_on' => today()->subDays(9), 'type' => 'payment', 'method' => 'cash', 'amount' => '300']);
    // In the period: +2000 leaf, -500 advance, and one delivery still without a rate.
    LeafReceipt::factory()->for($supplier)->create(['received_on' => today()->subDays(2), 'gross_kg' => '100', 'deduction_percent' => '0']);
    SupplierPayment::create(['supplier_id' => $supplier->id, 'paid_on' => today()->subDays(2), 'type' => 'advance', 'method' => 'bank', 'amount' => '500']);
    LeafReceipt::factory()->for($supplier)->create(['received_on' => today(), 'gross_kg' => '40', 'deduction_percent' => '0']);

    $this->actingAs(User::factory()->owner()->create())
        ->get(route('suppliers.show', [
            'supplier' => $supplier,
            'from' => today()->subDays(5)->toDateString(),
            'to' => today()->toDateString(),
        ]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('suppliers/show')
            ->where('statement.opening_balance', '800.00')
            ->has('statement.entries', 3)
            ->where('statement.entries.0.kind', 'leaf')
            ->where('statement.entries.0.balance', '2800.00')
            ->where('statement.entries.1.kind', 'advance')
            ->where('statement.entries.1.balance', '2300.00')
            ->where('statement.closing_balance', '2300.00')
            ->where('statement.totals.net_kg', '140.00')
            ->where('statement.totals.unpriced', 1)
            ->where('supplier.balance', '2300.00'));
});

test('suppliers with deliveries cannot be removed from the database', function () {
    $receipt = LeafReceipt::factory()->create();

    expect(fn () => $receipt->supplier->delete())->toThrow(QueryException::class);
});

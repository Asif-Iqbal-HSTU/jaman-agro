<?php

use App\Enums\UserRole;
use App\Models\LeafRate;
use App\Models\LeafReceipt;
use App\Models\Supplier;
use App\Models\User;

function manager(): User
{
    return User::factory()->create(['role' => UserRole::Manager]);
}

test('a delivery works out the deduction, net weight and amount', function () {
    LeafRate::create(['rate_date' => today(), 'rate' => '24.50']);
    $supplier = Supplier::factory()->create();
    $user = manager();

    $this->actingAs($user)
        ->post(route('leaf-receipts.store'), [
            'received_on' => today()->toDateString(),
            'supplier_id' => $supplier->id,
            'gross_kg' => '412.40',
            'tare_kg' => '6.40',
            'delivery_mode' => 'supplier',
            'deduction_type' => 'percent',
            'deduction_value' => '7.5',
        ])
        ->assertSessionHasNoErrors();

    $receipt = LeafReceipt::sole();

    // 412.40 - 6.40 = 406.00 kg of leaf; 7.5% of that is 30.45 kg.
    expect($receipt->deduction_kg)->toBe('30.45')
        ->and($receipt->net_kg)->toBe('375.55')
        ->and($receipt->rate)->toBe('24.50')
        // 375.55 * 24.50 = 9200.975, rounded half up.
        ->and($receipt->amount)->toBe('9200.98')
        ->and($receipt->recorded_by)->toBe($user->id)
        ->and($receipt->number)->toBe('GL-'.str_pad((string) $receipt->id, 6, '0', STR_PAD_LEFT));
});

test('a delivery waits for the rate and is priced once it is set', function () {
    $receipt = LeafReceipt::factory()->create(['gross_kg' => '100', 'deduction_percent' => '10']);

    expect($receipt->rate)->toBeNull()->and($receipt->amount)->toBeNull();

    $this->actingAs(manager())
        ->post(route('leaf-rates.store'), ['rate_date' => today()->toDateString(), 'rate' => '20'])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('leaf-receipts.index', ['date' => today()->toDateString()]));

    expect($receipt->fresh()->amount)->toBe('1800.00');
});

test('changing the rate of a day re-prices that day only', function () {
    $todayReceipt = LeafReceipt::factory()->create(['gross_kg' => '100', 'deduction_percent' => '0']);
    $yesterdayReceipt = LeafReceipt::factory()->create(['received_on' => today()->subDay(), 'gross_kg' => '100', 'deduction_percent' => '0']);

    $this->actingAs(manager());
    $this->post(route('leaf-rates.store'), ['rate_date' => today()->toDateString(), 'rate' => '20']);
    $this->post(route('leaf-rates.store'), ['rate_date' => today()->toDateString(), 'rate' => '22']);

    expect(LeafRate::count())->toBe(1)
        ->and($todayReceipt->fresh()->amount)->toBe('2200.00')
        ->and($yesterdayReceipt->fresh()->amount)->toBeNull();
});

test('moving a delivery to another day takes the rate of that day', function () {
    LeafRate::create(['rate_date' => today(), 'rate' => '20']);
    LeafRate::create(['rate_date' => today()->subDay(), 'rate' => '18']);
    $receipt = LeafReceipt::factory()->create(['gross_kg' => '50', 'deduction_percent' => '0']);

    $this->actingAs(manager())
        ->put(route('leaf-receipts.update', $receipt), [
            'received_on' => today()->subDay()->toDateString(),
            'supplier_id' => $receipt->supplier_id,
            'gross_kg' => '50',
            'delivery_mode' => 'supplier',
            'deduction_type' => 'percent',
            'deduction_value' => '0',
        ])
        ->assertSessionHasNoErrors();

    expect($receipt->fresh()->rate)->toBe('18.00')->and($receipt->fresh()->amount)->toBe('900.00');
});

test('save and add another returns to the entry form for the same day', function () {
    $supplier = Supplier::factory()->create();
    $date = today()->subDays(2)->toDateString();

    $this->actingAs(manager())
        ->post(route('leaf-receipts.store'), [
            'received_on' => $date,
            'supplier_id' => $supplier->id,
            'gross_kg' => '80',
            'delivery_mode' => 'supplier',
            'deduction_type' => 'percent',
            'deduction_value' => '5',
            'add_another' => true,
        ])
        ->assertRedirect(route('leaf-receipts.create', ['date' => $date]));
});

test('weights are validated', function () {
    $this->actingAs(manager())
        ->post(route('leaf-receipts.store'), [
            'received_on' => today()->addDay()->toDateString(),
            'supplier_id' => 999,
            'gross_kg' => '50',
            'tare_kg' => '60',
            'delivery_mode' => 'supplier',
            'deduction_type' => 'percent',
            'deduction_value' => '120',
        ])
        ->assertSessionHasErrors(['received_on', 'supplier_id', 'tare_kg']);
});

test('the owner can see leaf intake but cannot change it', function () {
    $owner = User::factory()->owner()->create();
    $receipt = LeafReceipt::factory()->create();

    $this->actingAs($owner)->get(route('leaf-receipts.index'))->assertOk();
    $this->actingAs($owner)->get(route('leaf-receipts.show', $receipt))->assertOk();
    $this->actingAs($owner)->get(route('leaf-receipts.create'))->assertForbidden();
    $this->actingAs($owner)->post(route('leaf-rates.store'), ['rate_date' => today()->toDateString(), 'rate' => '20'])->assertForbidden();
    $this->actingAs($owner)->delete(route('leaf-receipts.destroy', $receipt))->assertForbidden();

    expect(LeafReceipt::count())->toBe(1);
});

test('the daily page totals the deliveries of that day', function () {
    LeafRate::create(['rate_date' => today(), 'rate' => '10']);
    LeafReceipt::factory()->create(['gross_kg' => '100', 'deduction_percent' => '10']);
    LeafReceipt::factory()->create(['gross_kg' => '50', 'deduction_percent' => '0']);
    LeafReceipt::factory()->create(['received_on' => today()->subDay(), 'gross_kg' => '999']);

    $this->actingAs(manager())
        ->get(route('leaf-receipts.index'))
        ->assertInertia(fn ($page) => $page
            ->component('leaf-receipts/index')
            ->has('receipts', 2)
            ->where('rate', '10.00')
            ->where('totals.net_kg', '140.00')
            ->where('totals.amount', '1400.00')
            ->where('totals.suppliers', 2));
});

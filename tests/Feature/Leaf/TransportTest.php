<?php

use App\Enums\DeliveryMode;
use App\Models\LeafRate;
use App\Models\LeafReceipt;
use App\Models\Supplier;
use App\Models\User;
use App\Models\Vehicle;

/**
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function deliveryPayload(array $overrides = []): array
{
    return [
        'received_on' => today()->toDateString(),
        'supplier_id' => Supplier::factory()->create()->id,
        'gross_kg' => '110',
        'tare_kg' => '10',
        'delivery_mode' => 'supplier',
        'deduction_type' => 'kg',
        'deduction_value' => '5',
        ...$overrides,
    ];
}

test('moisture can be deducted as fixed kg', function () {
    LeafRate::create(['rate_date' => today(), 'rate' => '20']);

    $this->actingAs(User::factory()->create())
        ->post(route('leaf-receipts.store'), deliveryPayload())
        ->assertSessionHasNoErrors();

    $receipt = LeafReceipt::sole();

    // 110 - 10 = 100 kg of leaf, less 5 kg moisture.
    expect($receipt->deduction_type->value)->toBe('kg')
        ->and($receipt->deduction_percent)->toBeNull()
        ->and($receipt->deduction_kg)->toBe('5.00')
        ->and($receipt->net_kg)->toBe('95.00')
        ->and($receipt->amount)->toBe('1900.00');
});

test('a kg deduction cannot take the whole delivery', function () {
    $this->actingAs(User::factory()->create())
        ->post(route('leaf-receipts.store'), deliveryPayload(['deduction_value' => '100']))
        ->assertSessionHasErrors('deduction_value');

    expect(LeafReceipt::count())->toBe(0);
});

test('leaf collected by a factory vehicle is priced at the site rate', function () {
    LeafRate::create(['rate_date' => today(), 'rate' => '22', 'site_rate' => '19']);
    $vehicle = Vehicle::create(['name' => 'Pickup 1']);
    $user = User::factory()->create();

    $this->actingAs($user)->post(route('leaf-receipts.store'), deliveryPayload())->assertSessionHasNoErrors();
    $this->actingAs($user)
        ->post(route('leaf-receipts.store'), deliveryPayload(['delivery_mode' => 'factory_vehicle', 'vehicle_id' => $vehicle->id]))
        ->assertSessionHasNoErrors();

    [$brought, $collected] = LeafReceipt::orderBy('id')->get()->all();

    expect($brought->rate)->toBe('22.00')
        ->and($collected->delivery_mode)->toBe(DeliveryMode::FactoryVehicle)
        ->and($collected->vehicle_id)->toBe($vehicle->id)
        ->and($collected->rate)->toBe('19.00')
        ->and($collected->amount)->toBe('1805.00');
});

test('a factory-vehicle delivery needs a vehicle', function () {
    $this->actingAs(User::factory()->create())
        ->post(route('leaf-receipts.store'), deliveryPayload(['delivery_mode' => 'factory_vehicle']))
        ->assertSessionHasErrors('vehicle_id');
});

test('setting the site rate later prices the factory-vehicle deliveries of that day', function () {
    $vehicle = Vehicle::create(['name' => 'Pickup 1']);
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('leaf-receipts.store'), deliveryPayload(['delivery_mode' => 'factory_vehicle', 'vehicle_id' => $vehicle->id]));

    $this->actingAs($user)
        ->post(route('leaf-rates.store'), ['rate_date' => today()->toDateString(), 'rate' => '22'])
        ->assertSessionHasNoErrors();

    // No site rate yet: the delivery keeps waiting rather than taking the supplier rate.
    expect(LeafReceipt::sole()->amount)->toBeNull();

    $this->actingAs($user)
        ->post(route('leaf-rates.store'), ['rate_date' => today()->toDateString(), 'rate' => '22', 'site_rate' => '18'])
        ->assertSessionHasNoErrors();

    expect(LeafReceipt::sole()->amount)->toBe('1710.00');
});

test('the site rate cannot be above the delivered rate', function () {
    $this->actingAs(User::factory()->create())
        ->post(route('leaf-rates.store'), ['rate_date' => today()->toDateString(), 'rate' => '20', 'site_rate' => '21'])
        ->assertSessionHasErrors('site_rate');
});

test('the manager can keep a list of vehicles and warehouses', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->post(route('vehicles.store'), ['name' => 'Pickup 1', 'registration_no' => 'DHAKA-METRO-1'])->assertSessionHasNoErrors();
    $this->actingAs($user)->post(route('warehouses.store'), ['name' => 'National Warehouse', 'location' => 'Chattogram'])->assertSessionHasNoErrors();

    $this->actingAs($user)->get(route('vehicles.index'))->assertOk();
    $this->actingAs($user)->get(route('warehouses.index'))->assertOk();

    expect(Vehicle::sole()->name)->toBe('Pickup 1');
});

test('the owner cannot change vehicles', function () {
    $this->actingAs(User::factory()->owner()->create())
        ->post(route('vehicles.store'), ['name' => 'Pickup 1'])
        ->assertForbidden();
});

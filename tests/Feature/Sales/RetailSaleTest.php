<?php

use App\Enums\UserRole;
use App\Models\Customer;
use App\Models\CustomerPayment;
use App\Models\RetailSale;
use App\Models\StockMovement;
use App\Models\TeaGrade;
use App\Models\User;

beforeEach(function () {
    $this->pf = TeaGrade::create(['code' => 'PF']);
    $this->dust = TeaGrade::create(['code' => 'D']);
    $this->manager = User::factory()->create(['role' => UserRole::Manager]);
    $this->customer = Customer::create(['name' => 'Karim Store', 'opening_balance' => '500']);

    foreach ([$this->pf, $this->dust] as $grade) {
        StockMovement::create(['moved_on' => today(), 'tea_grade_id' => $grade->id, 'quantity_kg' => '100', 'type' => 'production']);
    }
});

function salePayload(array $items, array $overrides = []): array
{
    return [
        'sold_on' => today()->toDateString(),
        'customer_id' => null,
        'items' => $items,
        'paid_amount' => null,
        'method' => 'cash',
        ...$overrides,
    ];
}

test('a credit sale takes tea out of stock and adds the unpaid part to the customer balance', function () {
    $this->actingAs($this->manager)
        ->post(route('retail-sales.store'), salePayload(
            [
                ['tea_grade_id' => $this->pf->id, 'kg' => '10', 'rate' => '320'],
                ['tea_grade_id' => $this->dust->id, 'kg' => '5.5', 'rate' => '280'],
            ],
            ['customer_id' => $this->customer->id, 'paid_amount' => '2000'],
        ))
        ->assertSessionHasNoErrors();

    $sale = RetailSale::sole();

    // 10 * 320 + 5.5 * 280 = 3200 + 1540.
    expect($sale->total_amount)->toBe('4740.00')
        ->and($sale->payment->amount)->toBe('2000.00')
        ->and(StockMovement::balances())->toBe([$this->pf->id => '90.00', $this->dust->id => '94.50'])
        ->and(Customer::withBalance()->find($this->customer->id)->balance())->toBe('3240.00');
});

test('a walk-in sale must be paid in full', function () {
    $items = [['tea_grade_id' => $this->pf->id, 'kg' => '2', 'rate' => '300']];

    $this->actingAs($this->manager)
        ->post(route('retail-sales.store'), salePayload($items, ['paid_amount' => '500']))
        ->assertSessionHasErrors('paid_amount');

    $this->actingAs($this->manager)
        ->post(route('retail-sales.store'), salePayload($items, ['paid_amount' => '600']))
        ->assertSessionHasNoErrors();

    expect(RetailSale::sole()->customer_id)->toBeNull()
        ->and(CustomerPayment::sole()->customer_id)->toBeNull();
});

test('a sale cannot take more tea than is in stock, and nothing is saved', function () {
    $this->actingAs($this->manager)
        ->post(route('retail-sales.store'), salePayload(
            [
                ['tea_grade_id' => $this->pf->id, 'kg' => '10', 'rate' => '300'],
                ['tea_grade_id' => $this->dust->id, 'kg' => '150', 'rate' => '300'],
            ],
            ['customer_id' => $this->customer->id],
        ))
        ->assertSessionHasErrors('items');

    expect(RetailSale::count())->toBe(0)
        ->and(StockMovement::balances()[$this->pf->id])->toBe('100.00');
});

test('the same grade cannot be on a memo twice', function () {
    $this->actingAs($this->manager)
        ->post(route('retail-sales.store'), salePayload(
            [
                ['tea_grade_id' => $this->pf->id, 'kg' => '1', 'rate' => '300'],
                ['tea_grade_id' => $this->pf->id, 'kg' => '1', 'rate' => '300'],
            ],
            ['customer_id' => $this->customer->id],
        ))
        ->assertSessionHasErrors('items.0.tea_grade_id');
});

test('cancelling a sale returns the tea and removes the money taken with it', function () {
    $this->actingAs($this->manager)->post(route('retail-sales.store'), salePayload(
        [['tea_grade_id' => $this->pf->id, 'kg' => '10', 'rate' => '300']],
        ['customer_id' => $this->customer->id, 'paid_amount' => '1000'],
    ));

    $this->actingAs($this->manager)
        ->delete(route('retail-sales.destroy', RetailSale::sole()))
        ->assertRedirect(route('retail-sales.index'));

    expect(RetailSale::count())->toBe(0)
        ->and(CustomerPayment::count())->toBe(0)
        ->and(StockMovement::balances()[$this->pf->id])->toBe('100.00');
});

test('customer payments reduce what they owe, and the statement runs the balance', function () {
    $this->actingAs($this->manager)->post(route('retail-sales.store'), salePayload(
        [['tea_grade_id' => $this->pf->id, 'kg' => '10', 'rate' => '300']],
        ['customer_id' => $this->customer->id],
    ));

    $this->actingAs($this->manager)
        ->post(route('customer-payments.store'), [
            'paid_on' => today()->toDateString(),
            'customer_id' => $this->customer->id,
            'amount' => '1200',
            'method' => 'mobile_banking',
            'reference' => 'BK-1',
        ])
        ->assertRedirect(route('customers.show', $this->customer));

    $this->actingAs(User::factory()->owner()->create())
        ->get(route('customers.show', $this->customer))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('customers/show')
            ->where('statement.opening_balance', '500.00')
            ->has('statement.entries', 2)
            ->where('statement.entries.0.kind', 'sale')
            ->where('statement.entries.0.balance', '3500.00')
            ->where('statement.entries.1.balance', '2300.00')
            ->where('customer.balance', '2300.00'));

    expect(Customer::totalReceivable())->toBe('2300.00');
});

test('money taken with a sale can only be removed by cancelling the sale', function () {
    $this->actingAs($this->manager)->post(route('retail-sales.store'), salePayload(
        [['tea_grade_id' => $this->pf->id, 'kg' => '1', 'rate' => '300']],
        ['customer_id' => $this->customer->id, 'paid_amount' => '300'],
    ));

    $this->actingAs($this->manager)->delete(route('customer-payments.destroy', CustomerPayment::sole()));

    expect(CustomerPayment::count())->toBe(1);
});

test('the owner can see sales and customers but not record them', function () {
    $owner = User::factory()->owner()->create();

    $this->actingAs($owner)->get(route('retail-sales.index'))->assertOk();
    $this->actingAs($owner)->get(route('customers.index'))->assertOk();
    $this->actingAs($owner)->get(route('retail-sales.create'))->assertForbidden();
    $this->actingAs($owner)->get(route('customer-payments.create'))->assertForbidden();
    $this->actingAs($owner)->post(route('customers.store'), ['name' => 'X'])->assertForbidden();
});

test('the dashboard shows retail sales and money due from customers', function () {
    $this->actingAs($this->manager)->post(route('retail-sales.store'), salePayload(
        [['tea_grade_id' => $this->pf->id, 'kg' => '10', 'rate' => '300']],
        ['customer_id' => $this->customer->id, 'paid_amount' => '1000'],
    ));

    $this->actingAs($this->manager)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->where('sales.retail_amount', '3000.00')
            ->where('sales.customers_due', '2500.00')
            ->where('stockKg', '190.00'));
});

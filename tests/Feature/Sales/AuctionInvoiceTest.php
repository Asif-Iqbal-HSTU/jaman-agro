<?php

use App\Enums\UserRole;
use App\Models\AuctionInvoice;
use App\Models\Broker;
use App\Models\StockMovement;
use App\Models\TeaGrade;
use App\Models\User;
use App\Models\Warehouse;

beforeEach(function () {
    $this->pf = TeaGrade::create(['code' => 'PF']);
    $this->bop = TeaGrade::create(['code' => 'BOP']);
    $this->broker = Broker::create(['name' => 'National Brokers']);
    $this->manager = User::factory()->create(['role' => UserRole::Manager]);

    foreach ([$this->pf, $this->bop] as $grade) {
        StockMovement::create(['moved_on' => today(), 'tea_grade_id' => $grade->id, 'quantity_kg' => '1000', 'type' => 'production']);
    }
});

function invoicePayload(int $gradeId, array $overrides = []): array
{
    return [
        'invoice_no' => 'JA-0001',
        'packed_on' => today()->toDateString(),
        'tea_grade_id' => $gradeId,
        'package_type' => 'bag',
        'packages' => '20',
        'kg_per_package' => '40.5',
        ...$overrides,
    ];
}

test('packing an invoice takes its tea out of stock', function () {
    $this->actingAs($this->manager)
        ->post(route('auction-invoices.store'), invoicePayload($this->pf->id, ['broker_id' => $this->broker->id]))
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('auction-invoices.index'));

    $invoice = AuctionInvoice::sole();

    expect($invoice->net_kg)->toBe('810.00')
        ->and($invoice->status)->toBe('packed')
        ->and(StockMovement::balances()[$this->pf->id])->toBe('190.00')
        ->and(AuctionInvoice::nextNumber())->toBe('JA-0002');
});

test('an invoice cannot pack more than is in stock', function () {
    $this->actingAs($this->manager)
        ->post(route('auction-invoices.store'), invoicePayload($this->pf->id, ['packages' => '30', 'kg_per_package' => '40']))
        ->assertSessionHasErrors('packages');

    expect(AuctionInvoice::count())->toBe(0)
        ->and(StockMovement::balances()[$this->pf->id])->toBe('1000.00');
});

test('changing the grade or size of an invoice moves the stock with it', function () {
    $this->actingAs($this->manager)->post(route('auction-invoices.store'), invoicePayload($this->pf->id));
    $invoice = AuctionInvoice::sole();

    $this->actingAs($this->manager)
        ->put(route('auction-invoices.update', $invoice), invoicePayload($this->bop->id, ['packages' => '10']))
        ->assertSessionHasNoErrors();

    expect(StockMovement::balances())->toBe([
        $this->pf->id => '1000.00',
        $this->bop->id => '595.00',
    ]);
});

test('the auction result works out gross and net proceeds, then payment marks it paid', function () {
    $this->actingAs($this->manager)->post(route('auction-invoices.store'), invoicePayload($this->pf->id));
    $invoice = AuctionInvoice::sole();

    $this->actingAs($this->manager)
        ->put(route('auction-invoices.update', $invoice), invoicePayload($this->pf->id, [
            'dispatched_on' => today()->toDateString(),
            'sale_no' => '12',
            'lot_no' => '345',
        ]));
    expect($invoice->fresh()->status)->toBe('dispatched');

    $this->actingAs($this->manager)
        ->put(route('auction-invoices.update', $invoice), invoicePayload($this->pf->id, [
            'dispatched_on' => today()->toDateString(),
            'sold_on' => today()->toDateString(),
            'buyer' => 'Ispahani',
            'price_per_kg' => '215.50',
            'deductions' => '3500',
        ]))
        ->assertSessionHasNoErrors();

    $invoice->refresh();

    // 810 kg * 215.50 = 174,555.00, less 3,500 deductions.
    expect($invoice->gross_amount)->toBe('174555.00')
        ->and($invoice->net_amount)->toBe('171055.00')
        ->and($invoice->status)->toBe('sold');

    $this->actingAs($this->manager)
        ->put(route('auction-invoices.update', $invoice), invoicePayload($this->pf->id, [
            'sold_on' => today()->toDateString(),
            'price_per_kg' => '215.50',
            'deductions' => '3500',
            'paid_on' => today()->toDateString(),
            'payment_reference' => 'CHQ 778',
        ]));

    expect($invoice->fresh()->status)->toBe('paid');
});

test('payment needs a sale price, and a price needs a sale date', function () {
    $this->actingAs($this->manager)->post(route('auction-invoices.store'), invoicePayload($this->pf->id));
    $invoice = AuctionInvoice::sole();

    $this->actingAs($this->manager)
        ->put(route('auction-invoices.update', $invoice), invoicePayload($this->pf->id, ['paid_on' => today()->toDateString()]))
        ->assertSessionHasErrors('paid_on');

    $this->actingAs($this->manager)
        ->put(route('auction-invoices.update', $invoice), invoicePayload($this->pf->id, ['price_per_kg' => '200']))
        ->assertSessionHasErrors('sold_on');
});

test('an unsold invoice can be deleted and its tea returns to stock, a sold one cannot', function () {
    $this->actingAs($this->manager)->post(route('auction-invoices.store'), invoicePayload($this->pf->id));
    $invoice = AuctionInvoice::sole();

    $this->actingAs($this->manager)->delete(route('auction-invoices.destroy', $invoice));

    expect(AuctionInvoice::count())->toBe(0)
        ->and(StockMovement::balances()[$this->pf->id])->toBe('1000.00');

    $this->actingAs($this->manager)->post(route('auction-invoices.store'), invoicePayload($this->pf->id, [
        'invoice_no' => 'JA-0002',
    ]));
    $sold = AuctionInvoice::sole();
    $sold->update(['sold_on' => today(), 'price_per_kg' => '200']);

    $this->actingAs($this->manager)->delete(route('auction-invoices.destroy', $sold));

    expect(AuctionInvoice::count())->toBe(1);
});

test('invoice numbers are unique', function () {
    $this->actingAs($this->manager)->post(route('auction-invoices.store'), invoicePayload($this->pf->id));

    $this->actingAs($this->manager)
        ->post(route('auction-invoices.store'), invoicePayload($this->bop->id))
        ->assertSessionHasErrors('invoice_no');
});

test('the invoice list filters by status and sums what is due', function () {
    $this->actingAs($this->manager)->post(route('auction-invoices.store'), invoicePayload($this->pf->id));
    $this->actingAs($this->manager)->post(route('auction-invoices.store'), invoicePayload($this->bop->id, ['invoice_no' => 'JA-0002']));
    AuctionInvoice::where('invoice_no', 'JA-0002')->sole()->update(['sold_on' => today(), 'price_per_kg' => '100', 'deductions' => '10']);

    $this->actingAs(User::factory()->owner()->create())
        ->get(route('auction-invoices.index', ['status' => 'sold']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('invoices.data', 1)
            ->where('invoices.data.0.invoice_no', 'JA-0002')
            ->where('summary.awaiting_sale_kg', '810.00')
            ->where('summary.awaiting_payment', '80990.00'));
});

test('the owner can view invoices but not pack them', function () {
    $owner = User::factory()->owner()->create();

    $this->actingAs($owner)->get(route('auction-invoices.index'))->assertOk();
    $this->actingAs($owner)->get(route('auction-invoices.create'))->assertForbidden();
    $this->actingAs($owner)->post(route('auction-invoices.store'), invoicePayload($this->pf->id))->assertForbidden();
    $this->actingAs($owner)->get(route('brokers.index'))->assertForbidden();
});

test('an invoice records the warehouse it went to', function () {
    $warehouse = Warehouse::create(['name' => 'National Warehouse']);

    $this->actingAs($this->manager)
        ->post(route('auction-invoices.store'), invoicePayload($this->pf->id, ['warehouse_id' => $warehouse->id]))
        ->assertSessionHasNoErrors();

    expect(AuctionInvoice::sole()->warehouse->name)->toBe('National Warehouse');
});

test('dispatch and sale can still be filled in once the packing is locked', function () {
    $this->actingAs($this->manager)->post(route('auction-invoices.store'), invoicePayload($this->pf->id));
    $invoice = AuctionInvoice::sole();
    $packed = $invoice->packed_on->toDateString();
    $this->travel(4)->days();

    $this->actingAs($this->manager)
        ->put(route('auction-invoices.update', $invoice), invoicePayload($this->pf->id, ['packed_on' => $packed, 'dispatched_on' => today()->toDateString()]))
        ->assertSessionHasNoErrors();
    $this->actingAs($this->manager)
        ->put(route('auction-invoices.update', $invoice), invoicePayload($this->pf->id, ['packed_on' => $packed, 'dispatched_on' => today()->toDateString(), 'packages' => '10']));

    expect($invoice->fresh()->dispatched_on?->toDateString())->toBe(today()->toDateString())
        ->and($invoice->fresh()->packages)->toBe(20)
        ->and($invoice->fresh()->edited_at)->toBeNull();
});

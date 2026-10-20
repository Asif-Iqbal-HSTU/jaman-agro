<?php

use App\Enums\StockMovementType;
use App\Enums\UserRole;
use App\Models\LeafReceipt;
use App\Models\ProductionBatch;
use App\Models\StockMovement;
use App\Models\TeaGrade;
use App\Models\User;

beforeEach(function () {
    $this->pf = TeaGrade::create(['code' => 'PF', 'sort_order' => 10]);
    $this->bop = TeaGrade::create(['code' => 'BOP', 'sort_order' => 20]);
    $this->dust = TeaGrade::create(['code' => 'D', 'sort_order' => 30]);
    $this->manager = User::factory()->create(['role' => UserRole::Manager]);
});

function batchPayload(array $outputs, array $overrides = []): array
{
    return [
        'produced_on' => today()->toDateString(),
        'green_leaf_kg' => '1000',
        'withering_hours' => '14.5',
        'fermentation_minutes' => '75',
        'dryer_temp_c' => '120',
        'outputs' => $outputs,
        ...$overrides,
    ];
}

test('a batch records its grades and adds them to stock', function () {
    $this->actingAs($this->manager)
        ->post(route('production.store'), batchPayload([
            $this->pf->id => '120.50',
            $this->bop->id => '80',
            $this->dust->id => '',
        ]))
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('production.index', ['month' => today()->format('Y-m')]));

    $batch = ProductionBatch::sole();

    expect($batch->outputs()->count())->toBe(2)
        ->and($batch->recorded_by)->toBe($this->manager->id)
        ->and(StockMovement::balances())->toBe([
            $this->pf->id => '120.50',
            $this->bop->id => '80.00',
        ])
        ->and(StockMovement::where('type', StockMovementType::Production)->count())->toBe(2)
        ->and(ProductionBatch::recovery('200.50', '1000'))->toBe('20.05');
});

test('editing a batch keeps stock in step, including grades that were removed', function () {
    $this->actingAs($this->manager)->post(route('production.store'), batchPayload([
        $this->pf->id => '100',
        $this->bop->id => '50',
    ]));
    $batch = ProductionBatch::sole();

    $this->actingAs($this->manager)
        ->put(route('production.update', $batch), batchPayload(
            [$this->pf->id => '110', $this->dust->id => '30'],
            ['produced_on' => today()->subDay()->toDateString()],
        ))
        ->assertSessionHasNoErrors();

    expect(StockMovement::balances())->toBe([
        $this->pf->id => '110.00',
        $this->dust->id => '30.00',
    ])
        ->and($batch->outputs()->pluck('tea_grade_id')->sort()->values()->all())->toBe([$this->pf->id, $this->dust->id])
        ->and(StockMovement::pluck('moved_on')->map->toDateString()->unique()->all())->toBe([today()->subDay()->toDateString()]);
});

test('deleting a batch takes its tea out of stock', function () {
    $this->actingAs($this->manager)->post(route('production.store'), batchPayload([$this->pf->id => '100']));

    $this->actingAs($this->manager)
        ->delete(route('production.destroy', ProductionBatch::sole()))
        ->assertSessionHasNoErrors();

    expect(ProductionBatch::count())->toBe(0)
        ->and(StockMovement::count())->toBe(0);
});

test('a batch cannot be cut below what has already left stock', function () {
    $this->actingAs($this->manager)->post(route('production.store'), batchPayload([$this->pf->id => '100']));
    $batch = ProductionBatch::sole();

    // 70 kg of PF has already gone out of the warehouse.
    StockMovement::create(['moved_on' => today(), 'tea_grade_id' => $this->pf->id, 'quantity_kg' => '-70', 'type' => 'adjustment', 'reason' => 'Samples']);

    $this->actingAs($this->manager)
        ->put(route('production.update', $batch), batchPayload([$this->pf->id => '50']))
        ->assertSessionHasErrors('outputs');

    $this->actingAs($this->manager)
        ->delete(route('production.destroy', $batch))
        ->assertSessionHasErrors('outputs');

    expect($batch->outputs()->sole()->kg)->toBe('100.00')
        ->and(StockMovement::balances()[$this->pf->id])->toBe('30.00');
});

test('a batch needs leaf and at least one grade', function () {
    $this->actingAs($this->manager)
        ->post(route('production.store'), batchPayload(
            [$this->pf->id => '', $this->bop->id => '0'],
            ['green_leaf_kg' => '0', 'produced_on' => today()->addDay()->toDateString()],
        ))
        ->assertSessionHasErrors(['green_leaf_kg', 'produced_on']);

    $this->actingAs($this->manager)
        ->post(route('production.store'), batchPayload([$this->pf->id => '', $this->bop->id => '0']))
        ->assertSessionHasErrors('outputs');

    $this->actingAs($this->manager)
        ->post(route('production.store'), batchPayload([999 => '10']))
        ->assertSessionHasErrors('outputs');

    expect(ProductionBatch::count())->toBe(0);
});

test('the month view totals made tea per grade and recovery', function () {
    LeafReceipt::factory()->create(['gross_kg' => '2100', 'deduction_percent' => '0']);
    $this->actingAs($this->manager)->post(route('production.store'), batchPayload([$this->pf->id => '150', $this->bop->id => '60']));
    $this->actingAs($this->manager)->post(route('production.store'), batchPayload([$this->pf->id => '50'], ['green_leaf_kg' => '1000']));

    $this->actingAs(User::factory()->owner()->create())
        ->get(route('production.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('production/index')
            ->has('batches', 2)
            ->where('batches.0.recovery', '21.00')
            ->where('totals.made_tea_kg', '260.00')
            ->where('totals.green_leaf_kg', '2000.00')
            ->where('totals.recovery', '13.00')
            ->where('totals.leaf_received_kg', '2100.00')
            ->where("totals.by_grade.{$this->pf->id}", '200.00'));
});

test('the owner can view production but not record it', function () {
    $owner = User::factory()->owner()->create();

    $this->actingAs($owner)->get(route('production.index'))->assertOk();
    $this->actingAs($owner)->get(route('production.create'))->assertForbidden();
    $this->actingAs($owner)->post(route('production.store'), batchPayload([$this->pf->id => '10']))->assertForbidden();
});

<?php

use App\Enums\UserRole;
use App\Models\ActivityLog;
use App\Models\StockMovement;
use App\Models\TeaGrade;
use App\Models\User;

beforeEach(function () {
    $this->grade = TeaGrade::create(['code' => 'PF']);
    $this->manager = User::factory()->create(['role' => UserRole::Manager]);

    StockMovement::create(['moved_on' => today(), 'tea_grade_id' => $this->grade->id, 'quantity_kg' => '100', 'type' => 'production']);
});

function adjustment(int $gradeId, string $direction, string $kg): array
{
    return [
        'moved_on' => today()->toDateString(),
        'tea_grade_id' => $gradeId,
        'direction' => $direction,
        'quantity_kg' => $kg,
        'reason' => 'Monthly recount',
    ];
}

test('stock can be adjusted with a reason, and it is logged', function () {
    $this->actingAs($this->manager)
        ->post(route('stock.adjust.store'), adjustment($this->grade->id, 'remove', '12.5'))
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('stock.index'));

    $this->actingAs($this->manager)
        ->post(route('stock.adjust.store'), adjustment($this->grade->id, 'add', '2'))
        ->assertSessionHasNoErrors();

    expect(StockMovement::balances()[$this->grade->id])->toBe('89.50')
        ->and(ActivityLog::where('subject_type', (new StockMovement)->getMorphClass())->count())->toBe(2);
});

test('stock cannot be taken below zero', function () {
    $this->actingAs($this->manager)
        ->post(route('stock.adjust.store'), adjustment($this->grade->id, 'remove', '100.01'))
        ->assertSessionHasErrors('outputs');

    expect(StockMovement::balances()[$this->grade->id])->toBe('100.00');
});

test('an adjustment needs a reason', function () {
    $this->actingAs($this->manager)
        ->post(route('stock.adjust.store'), [...adjustment($this->grade->id, 'add', '1'), 'reason' => ''])
        ->assertSessionHasErrors('reason');
});

test('the stock page shows the balance of each grade', function () {
    $this->actingAs(User::factory()->owner()->create())
        ->get(route('stock.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('stock/index')
            ->where('total', '100.00')
            ->where('grades.0.code', 'PF')
            ->where('grades.0.produced', '100.00')
            ->where('grades.0.balance', '100.00')
            ->has('movements.data', 1));
});

test('the owner cannot adjust stock or manage grades', function () {
    $owner = User::factory()->owner()->create();

    $this->actingAs($owner)->get(route('stock.adjust'))->assertForbidden();
    $this->actingAs($owner)->post(route('stock.adjust.store'), adjustment($this->grade->id, 'add', '1'))->assertForbidden();
    $this->actingAs($owner)->get(route('grades.index'))->assertForbidden();
});

test('managers can add, rename and switch off grades', function () {
    $this->actingAs($this->manager)
        ->post(route('grades.store'), ['code' => 'BOPSM', 'name' => 'BOP Small', 'sort_order' => '', 'is_active' => '1'])
        ->assertSessionHasNoErrors();

    $grade = TeaGrade::where('code', 'BOPSM')->sole();

    $this->actingAs($this->manager)
        ->put(route('grades.update', $grade), ['code' => 'BOPSM', 'name' => 'Broken Orange Pekoe Small', 'sort_order' => '5', 'is_active' => '0'])
        ->assertSessionHasNoErrors();

    expect($grade->fresh()->is_active)->toBeFalse()
        ->and($grade->fresh()->sort_order)->toBe(5);

    $this->actingAs($this->manager)
        ->post(route('grades.store'), ['code' => 'PF'])
        ->assertSessionHasErrors('code');
});

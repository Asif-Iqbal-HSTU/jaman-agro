<?php

use App\Enums\UserRole;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\User;

beforeEach(function () {
    $this->fuel = ExpenseCategory::create(['name' => 'Fuel (gas, coal)']);
    $this->power = ExpenseCategory::create(['name' => 'Electricity', 'kind' => 'factory']);
    $this->manager = User::factory()->create(['role' => UserRole::Manager]);
});

function expensePayload(int $categoryId, array $overrides = []): array
{
    return [
        'spent_on' => today()->toDateString(),
        'expense_category_id' => $categoryId,
        'amount' => '12500.50',
        'method' => 'cash',
        'paid_to' => 'Titas Gas',
        ...$overrides,
    ];
}

test('managers can record, correct and delete expenses', function () {
    $this->actingAs($this->manager)
        ->post(route('expenses.store'), expensePayload($this->fuel->id))
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('expenses.index', ['month' => today()->format('Y-m')]));

    $expense = Expense::sole();

    expect($expense->amount)->toBe('12500.50')
        ->and($expense->recorded_by)->toBe($this->manager->id);

    $this->actingAs($this->manager)
        ->put(route('expenses.update', $expense), expensePayload($this->power->id, ['amount' => '8000']))
        ->assertSessionHasNoErrors();

    expect($expense->fresh()->expense_category_id)->toBe($this->power->id);

    $this->actingAs($this->manager)->delete(route('expenses.destroy', $expense));

    expect(Expense::count())->toBe(0);
});

test('expenses are validated', function () {
    $this->actingAs($this->manager)
        ->post(route('expenses.store'), expensePayload(999, [
            'amount' => '0',
            'method' => 'barter',
            'spent_on' => today()->addDay()->toDateString(),
        ]))
        ->assertSessionHasErrors(['expense_category_id', 'amount', 'method', 'spent_on']);
});

test('the month view totals each category', function () {
    Expense::create([...expensePayload($this->fuel->id), 'amount' => '1000']);
    Expense::create([...expensePayload($this->fuel->id), 'amount' => '500']);
    Expense::create([...expensePayload($this->power->id), 'amount' => '250']);
    Expense::create([...expensePayload($this->power->id), 'amount' => '9999', 'spent_on' => today()->subMonths(2)]);

    $this->actingAs(User::factory()->owner()->create())
        ->get(route('expenses.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('expenses.data', 3)
            ->where('total', '1750.00')
            // Same sort order, so listed by name: Electricity, then Fuel.
            ->where('categories.0.total', '250.00')
            ->where('categories.1.total', '1500.00'));
});

test('the owner can see expenses but not record them or change categories', function () {
    $owner = User::factory()->owner()->create();

    $this->actingAs($owner)->get(route('expenses.index'))->assertOk();
    $this->actingAs($owner)->get(route('expenses.create'))->assertForbidden();
    $this->actingAs($owner)->post(route('expenses.store'), expensePayload($this->fuel->id))->assertForbidden();
    $this->actingAs($owner)->get(route('expense-categories.index'))->assertForbidden();
});

test('managers can add and switch off categories', function () {
    $this->actingAs($this->manager)
        ->post(route('expense-categories.store'), ['name' => 'Tea board cess', 'kind' => 'factory', 'sort_order' => '', 'is_active' => '1'])
        ->assertSessionHasNoErrors();

    $category = ExpenseCategory::where('name', 'Tea board cess')->sole();

    $this->actingAs($this->manager)
        ->put(route('expense-categories.update', $category), ['name' => 'Tea board cess', 'kind' => 'factory', 'is_active' => '0'])
        ->assertSessionHasNoErrors();

    expect($category->fresh()->is_active)->toBeFalse();

    $this->actingAs($this->manager)
        ->post(route('expense-categories.store'), ['name' => 'Electricity', 'kind' => 'factory'])
        ->assertSessionHasErrors('name');
});

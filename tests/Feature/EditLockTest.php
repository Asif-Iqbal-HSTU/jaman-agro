<?php

use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\LeafReceipt;
use App\Models\UnlockRequest;
use App\Models\User;
use App\Support\EditLock;

/**
 * @return array<string, mixed>
 */
function correctedDelivery(LeafReceipt $receipt, string $gross): array
{
    return [
        'received_on' => $receipt->received_on->toDateString(),
        'supplier_id' => $receipt->supplier_id,
        'gross_kg' => $gross,
        'tare_kg' => '0',
        'delivery_mode' => 'supplier',
        'deduction_type' => 'percent',
        'deduction_value' => '0',
    ];
}

test('an entry can be corrected within the edit limit and is marked as edited', function () {
    $receipt = LeafReceipt::factory()->create(['gross_kg' => '100', 'deduction_percent' => '0']);

    expect($receipt->edited_at)->toBeNull();

    $this->actingAs(User::factory()->create())
        ->put(route('leaf-receipts.update', $receipt), correctedDelivery($receipt, '120'))
        ->assertSessionHasNoErrors();

    expect($receipt->fresh()->gross_kg)->toBe('120.00')
        ->and($receipt->fresh()->edited_at)->not->toBeNull();
});

test('repricing by a rate change does not mark entries as edited', function () {
    $receipt = LeafReceipt::factory()->create(['gross_kg' => '100', 'deduction_percent' => '0']);

    $this->actingAs(User::factory()->create())
        ->post(route('leaf-rates.store'), ['rate_date' => today()->toDateString(), 'rate' => '20']);

    expect($receipt->fresh()->amount)->toBe('2000.00')
        ->and($receipt->fresh()->edited_at)->toBeNull();
});

test('after the edit limit the manager cannot change or delete an entry', function () {
    $receipt = LeafReceipt::factory()->create(['received_on' => today()->subDays(4), 'gross_kg' => '100', 'deduction_percent' => '0']);
    $this->travel(4)->days();
    $manager = User::factory()->create();

    $this->actingAs($manager)
        ->put(route('leaf-receipts.update', $receipt), correctedDelivery($receipt, '120'))
        ->assertRedirect();
    $this->actingAs($manager)->delete(route('leaf-receipts.destroy', $receipt))->assertRedirect();

    expect($receipt->fresh())->not->toBeNull()
        ->and($receipt->fresh()->gross_kg)->toBe('100.00')
        ->and(EditLock::state($receipt, $manager))->toBe(EditLock::LOCKED);
});

test('the administrator is never locked out', function () {
    $receipt = LeafReceipt::factory()->create(['gross_kg' => '100', 'deduction_percent' => '0']);
    $this->travel(10)->days();

    $this->actingAs(User::factory()->admin()->create())
        ->put(route('leaf-receipts.update', $receipt), correctedDelivery($receipt, '120'))
        ->assertSessionHasNoErrors();

    expect($receipt->fresh()->gross_kg)->toBe('120.00');
});

test('the manager asks to unlock, the administrator approves, and the entry can be changed', function () {
    $receipt = LeafReceipt::factory()->create(['gross_kg' => '100', 'deduction_percent' => '0']);
    $this->travel(4)->days();
    $manager = User::factory()->create();
    $admin = User::factory()->admin()->create();

    $this->actingAs($manager)
        ->post(route('unlock-requests.store'), ['subject' => 'leaf_receipt', 'id' => $receipt->id, 'reason' => 'Wrong weight'])
        ->assertSessionHasNoErrors();

    $request = UnlockRequest::sole();
    expect($request->status)->toBe(UnlockRequest::PENDING)
        ->and(EditLock::state($receipt, $manager))->toBe(EditLock::PENDING);

    // Still locked while the request waits.
    $this->actingAs($manager)->put(route('leaf-receipts.update', $receipt), correctedDelivery($receipt, '120'));
    expect($receipt->fresh()->gross_kg)->toBe('100.00');

    $this->actingAs($admin)
        ->put(route('admin.unlock-requests.update', $request), ['decision' => 'approved'])
        ->assertRedirect(route('admin.unlock-requests.index'));

    expect(EditLock::state($receipt, $manager))->toBe(EditLock::UNLOCKED);

    $this->actingAs($manager)
        ->put(route('leaf-receipts.update', $receipt), correctedDelivery($receipt, '120'))
        ->assertSessionHasNoErrors();

    expect($receipt->fresh()->gross_kg)->toBe('120.00');

    // The unlock runs out after a day.
    $this->travel(25)->hours();
    expect(EditLock::state($receipt, $manager))->toBe(EditLock::LOCKED);
});

test('a rejected request leaves the entry locked', function () {
    $receipt = LeafReceipt::factory()->create();
    $this->travel(4)->days();
    $manager = User::factory()->create();

    $this->actingAs($manager)->post(route('unlock-requests.store'), ['subject' => 'leaf_receipt', 'id' => $receipt->id, 'reason' => 'Typo']);
    $this->actingAs(User::factory()->admin()->create())
        ->put(route('admin.unlock-requests.update', UnlockRequest::sole()), ['decision' => 'rejected']);

    expect(EditLock::state($receipt, $manager))->toBe(EditLock::LOCKED);
});

test('an open entry needs no unlock request', function () {
    $receipt = LeafReceipt::factory()->create();

    $this->actingAs(User::factory()->create())
        ->post(route('unlock-requests.store'), ['subject' => 'leaf_receipt', 'id' => $receipt->id, 'reason' => 'Typo']);

    expect(UnlockRequest::count())->toBe(0);
});

test('only the administrator decides unlock requests', function () {
    $receipt = LeafReceipt::factory()->create();
    $this->travel(4)->days();
    $manager = User::factory()->create();
    $this->actingAs($manager)->post(route('unlock-requests.store'), ['subject' => 'leaf_receipt', 'id' => $receipt->id, 'reason' => 'Typo']);

    $this->actingAs($manager)
        ->put(route('admin.unlock-requests.update', UnlockRequest::sole()), ['decision' => 'approved'])
        ->assertForbidden();
    $this->actingAs(User::factory()->owner()->create())
        ->post(route('unlock-requests.store'), ['subject' => 'leaf_receipt', 'id' => $receipt->id, 'reason' => 'Typo'])
        ->assertForbidden();
});

test('expenses lock too', function () {
    $category = ExpenseCategory::create(['name' => 'Electricity']);
    $expense = Expense::create(['spent_on' => today(), 'expense_category_id' => $category->id, 'amount' => '500', 'method' => 'cash']);
    $this->travel(4)->days();

    $this->actingAs(User::factory()->create())->delete(route('expenses.destroy', $expense));

    expect($expense->fresh())->not->toBeNull();
});

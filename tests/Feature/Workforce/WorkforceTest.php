<?php

use App\Enums\ExpenseKind;
use App\Models\Attendance;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\LeafRate;
use App\Models\LeafReceipt;
use App\Models\PieceRate;
use App\Models\PieceWork;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\WagePayment;
use App\Models\Worker;
use App\Services\AnnualReport;
use App\Services\CashBook;
use App\Services\WageSheet;
use Illuminate\Support\Carbon;

function hourlyWorker(string $rate = '50'): Worker
{
    return Worker::create(['name' => 'Rahim', 'pay_type' => 'hourly', 'hourly_rate' => $rate]);
}

function contractWorker(): Worker
{
    return Worker::create(['name' => 'Karim', 'pay_type' => 'contract']);
}

test('attendance works out the hours and pay, including a night shift', function () {
    $day = hourlyWorker('50');
    $night = Worker::create(['name' => 'Salam', 'pay_type' => 'hourly', 'hourly_rate' => '60']);

    $this->actingAs(User::factory()->create())
        ->post(route('attendance.store'), [
            'work_date' => today()->toDateString(),
            'rows' => [
                ['worker_id' => $day->id, 'time_in' => '08:00', 'time_out' => '17:30'],
                ['worker_id' => $night->id, 'time_in' => '22:00', 'time_out' => '06:00'],
            ],
        ])
        ->assertSessionHasNoErrors();

    $dayRecord = Attendance::where('worker_id', $day->id)->sole();
    $nightRecord = Attendance::where('worker_id', $night->id)->sole();

    expect($dayRecord->hours)->toBe('9.50')
        ->and($dayRecord->amount)->toBe('475.00')
        ->and($nightRecord->hours)->toBe('8.00')
        ->and($nightRecord->amount)->toBe('480.00');
});

test('a changed hourly rate leaves earlier days alone', function () {
    $worker = hourlyWorker('50');
    $user = User::factory()->create();
    $this->actingAs($user)->post(route('attendance.store'), [
        'work_date' => today()->subDay()->toDateString(),
        'rows' => [['worker_id' => $worker->id, 'time_in' => '08:00', 'time_out' => '12:00']],
    ]);

    $worker->update(['hourly_rate' => '70']);
    $this->actingAs($user)->post(route('attendance.store'), [
        'work_date' => today()->toDateString(),
        'rows' => [['worker_id' => $worker->id, 'time_in' => '08:00', 'time_out' => '12:00']],
    ]);

    expect(Attendance::orderBy('work_date')->pluck('amount')->all())->toBe(['200.00', '280.00']);
});

test('clearing the times removes the day, and saving unchanged rows does not mark them edited', function () {
    $worker = hourlyWorker();
    $user = User::factory()->create();
    $row = ['worker_id' => $worker->id, 'time_in' => '08:00', 'time_out' => '12:00'];

    $this->actingAs($user)->post(route('attendance.store'), ['work_date' => today()->toDateString(), 'rows' => [$row]]);
    $this->actingAs($user)->post(route('attendance.store'), ['work_date' => today()->toDateString(), 'rows' => [$row]]);

    expect(Attendance::sole()->edited_at)->toBeNull();

    $this->actingAs($user)->post(route('attendance.store'), [
        'work_date' => today()->toDateString(),
        'rows' => [['worker_id' => $worker->id, 'time_in' => '', 'time_out' => '']],
    ]);

    expect(Attendance::count())->toBe(0);
});

test('contract work takes the job rate of the day it was recorded', function () {
    $worker = contractWorker();
    $bagging = PieceRate::create(['name' => 'Bagging', 'unit' => 'bag', 'rate' => '8']);
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('piece-work.store'), ['work_date' => today()->toDateString(), 'worker_id' => $worker->id, 'piece_rate_id' => $bagging->id, 'quantity' => '40'])
        ->assertSessionHasNoErrors();

    $this->actingAs($user)->put(route('piece-rates.update', $bagging), ['name' => 'Bagging', 'unit' => 'bag', 'rate' => '10']);

    expect(PieceWork::sole()->rate)->toBe('8.00')
        ->and(PieceWork::sole()->amount)->toBe('320.00');
});

test('contract work is only for contract workers', function () {
    $job = PieceRate::create(['name' => 'Bagging', 'unit' => 'bag', 'rate' => '8']);

    $this->actingAs(User::factory()->create())
        ->post(route('piece-work.store'), ['work_date' => today()->toDateString(), 'worker_id' => hourlyWorker()->id, 'piece_rate_id' => $job->id, 'quantity' => '1'])
        ->assertSessionHasErrors('worker_id');
});

test('the pay periods run Thursday to Saturday and Sunday to Wednesday', function () {
    // Monday 19 October 2026.
    $periods = WageSheet::periods(Carbon::parse('2026-10-19'));

    expect($periods['sunday'])->toBe(['from' => '2026-10-15', 'to' => '2026-10-17'])
        ->and($periods['thursday'])->toBe(['from' => '2026-10-11', 'to' => '2026-10-14']);
});

test('the wage sheet adds hours, contract work and bonuses, less what was paid', function () {
    $hourly = hourlyWorker('50');
    $contract = contractWorker();
    $job = PieceRate::create(['name' => 'Loading bags', 'unit' => 'bag', 'rate' => '8']);
    $user = User::factory()->create();
    $date = today()->toDateString();

    $this->actingAs($user)->post(route('attendance.store'), ['work_date' => $date, 'rows' => [['worker_id' => $hourly->id, 'time_in' => '08:00', 'time_out' => '16:00']]]);
    $this->actingAs($user)->post(route('piece-work.store'), ['work_date' => $date, 'worker_id' => $contract->id, 'piece_rate_id' => $job->id, 'quantity' => '50']);
    $this->actingAs($user)
        ->post(route('wages.bonus'), ['worker_id' => $hourly->id, 'given_on' => $date, 'amount' => '100', 'reason' => 'Night work'])
        ->assertSessionHasNoErrors();
    $this->actingAs($user)
        ->post(route('wages.pay'), ['worker_id' => $hourly->id, 'paid_on' => $date, 'period_from' => $date, 'period_to' => $date, 'amount' => '300', 'method' => 'cash'])
        ->assertSessionHasNoErrors();

    $rows = collect(WageSheet::for(today(), today()))->keyBy('id');

    // 8 h × ৳50 = ৳400, plus a ৳100 bonus, ৳300 paid.
    expect($rows[$hourly->id]['earned'])->toBe('500.00')
        ->and($rows[$hourly->id]['paid_in_period'])->toBe('300.00')
        ->and($rows[$hourly->id]['owed'])->toBe('200.00')
        ->and($rows[$contract->id]['earned'])->toBe('400.00')
        ->and($rows[$contract->id]['owed'])->toBe('400.00');

    $this->actingAs($user)->get(route('wages.index'))->assertOk();
});

test('wages paid show in the cash book as money out', function () {
    $worker = hourlyWorker();
    WagePayment::create(['worker_id' => $worker->id, 'paid_on' => today(), 'period_from' => today(), 'period_to' => today(), 'amount' => '750', 'method' => 'cash']);

    $book = CashBook::for(today(), today());

    expect(collect($book['entries'])->firstWhere('kind', 'wages'))
        ->toMatchArray(['out' => '750.00', 'details' => 'Rahim']);
});

test('reports count transport and wages as costs and give the landed cost of leaf', function () {
    $date = today()->startOfYear()->addDays(10);
    LeafRate::create(['rate_date' => $date, 'rate' => '20']);
    LeafReceipt::factory()->create(['received_on' => $date, 'gross_kg' => '1000', 'deduction_percent' => '0']);

    $fuel = ExpenseCategory::create(['name' => 'Vehicle fuel', 'kind' => ExpenseKind::Vehicle]);
    $power = ExpenseCategory::create(['name' => 'Electricity', 'kind' => ExpenseKind::Factory]);
    $vehicle = Vehicle::create(['name' => 'Pickup 1']);
    Expense::create(['spent_on' => $date, 'expense_category_id' => $fuel->id, 'vehicle_id' => $vehicle->id, 'amount' => '2000', 'method' => 'cash']);
    Expense::create(['spent_on' => $date, 'expense_category_id' => $power->id, 'amount' => '500', 'method' => 'cash']);
    Attendance::create(['work_date' => $date, 'worker_id' => hourlyWorker('50')->id, 'time_in' => '08:00', 'time_out' => '12:00', 'rate' => '50']);

    $totals = AnnualReport::for((int) $date->format('Y'))['totals'];

    // ৳20,000 of leaf plus ৳2,000 of vehicle running = ৳22 a kg landed.
    expect($totals['transport_cost'])->toBe('2000.00')
        ->and($totals['expenses'])->toBe('500.00')
        ->and($totals['wages'])->toBe('200.00')
        ->and($totals['costs'])->toBe('22700.00')
        ->and($totals['landed_leaf_cost_per_kg'])->toBe('22.00');
});

test('a vehicle expense needs a vehicle', function () {
    $fuel = ExpenseCategory::create(['name' => 'Vehicle fuel', 'kind' => ExpenseKind::Vehicle]);

    $this->actingAs(User::factory()->create())
        ->post(route('expenses.store'), ['spent_on' => today()->toDateString(), 'expense_category_id' => $fuel->id, 'amount' => '100', 'method' => 'cash'])
        ->assertSessionHasErrors('vehicle_id');
});

test('the owner can see the workforce pages but not change them', function () {
    $owner = User::factory()->owner()->create();
    $worker = hourlyWorker();

    $this->actingAs($owner)->get(route('workers.index'))->assertOk();
    $this->actingAs($owner)->get(route('attendance.index'))->assertOk();
    $this->actingAs($owner)->get(route('piece-work.index'))->assertOk();
    $this->actingAs($owner)->get(route('wages.index'))->assertOk();

    $this->actingAs($owner)
        ->post(route('wages.pay'), ['worker_id' => $worker->id, 'paid_on' => today()->toDateString(), 'period_from' => today()->toDateString(), 'period_to' => today()->toDateString(), 'amount' => '10', 'method' => 'cash'])
        ->assertForbidden();
    $this->actingAs($owner)->get(route('workers.create'))->assertForbidden();
});

test('the manager sees the go-live checklist', function () {
    $this->actingAs(User::factory()->create())->get(route('setup'))->assertOk();
    $this->actingAs(User::factory()->owner()->create())->get(route('setup'))->assertForbidden();
});

test('a payment counts for the period it was made for, not the day it was handed over', function () {
    $worker = hourlyWorker();
    $monday = today()->startOfWeek();

    // Last week's wages handed over on Monday: they belong to last week, not this one.
    WagePayment::create(['worker_id' => $worker->id, 'paid_on' => $monday, 'period_from' => $monday->copy()->subWeek(), 'period_to' => $monday->copy()->subDay(), 'amount' => '900', 'method' => 'cash']);

    $thisWeek = collect(WageSheet::for($monday, $monday->copy()->addDays(6)))->keyBy('id');
    $lastWeek = collect(WageSheet::for($monday->copy()->subWeek(), $monday->copy()->subDay()))->keyBy('id');

    expect($thisWeek[$worker->id]['paid_in_period'])->toBe('0.00')
        ->and($lastWeek[$worker->id]['paid_in_period'])->toBe('900.00');
});

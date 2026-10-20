<?php

use App\Models\AuctionInvoice;
use App\Models\Customer;
use App\Models\CustomerPayment;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\LeafRate;
use App\Models\LeafReceipt;
use App\Models\ProductionBatch;
use App\Models\RetailSale;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\SupplierPayment;
use App\Models\TeaGrade;
use App\Models\User;
use App\Services\AnnualReport;

beforeEach(function () {
    $this->date = today()->setDate((int) today()->format('Y'), 3, 10);
    $this->pf = TeaGrade::create(['code' => 'PF']);
    $this->category = ExpenseCategory::create(['name' => 'Electricity']);

    // March: 1000 kg net leaf at ৳20 = ৳20,000.
    LeafRate::create(['rate_date' => $this->date, 'rate' => '20']);
    LeafReceipt::factory()->create(['received_on' => $this->date, 'gross_kg' => '1000', 'deduction_percent' => '0']);

    // 1000 kg leaf made 220 kg PF.
    $batch = ProductionBatch::create(['produced_on' => $this->date, 'green_leaf_kg' => '1000']);
    $batch->outputs()->create(['tea_grade_id' => $this->pf->id, 'kg' => '220']);
    StockMovement::create(['moved_on' => $this->date, 'tea_grade_id' => $this->pf->id, 'quantity_kg' => '220', 'type' => 'production']);

    // 200 kg sold at auction for ৳250/kg less ৳1,000 = ৳49,000 net, paid by the broker.
    AuctionInvoice::create([
        'invoice_no' => 'JA-0001', 'packed_on' => $this->date, 'tea_grade_id' => $this->pf->id,
        'package_type' => 'bag', 'packages' => 4, 'kg_per_package' => '50',
        'sold_on' => $this->date, 'price_per_kg' => '250', 'deductions' => '1000', 'paid_on' => $this->date,
    ]);

    // Retail ৳3,000 with ৳1,000 paid; ৳6,000 of electricity.
    $customer = Customer::create(['name' => 'Karim Store']);
    $sale = RetailSale::create(['sold_on' => $this->date, 'customer_id' => $customer->id, 'total_amount' => '3000']);
    CustomerPayment::create(['paid_on' => $this->date, 'customer_id' => $customer->id, 'retail_sale_id' => $sale->id, 'amount' => '1000', 'method' => 'cash']);
    Expense::create(['spent_on' => $this->date, 'expense_category_id' => $this->category->id, 'amount' => '6000', 'method' => 'bank']);

    $supplier = LeafReceipt::sole()->supplier;
    SupplierPayment::create(['supplier_id' => $supplier->id, 'paid_on' => $this->date, 'type' => 'payment', 'method' => 'cash', 'amount' => '15000']);
});

test('the annual report adds up each month', function () {
    $report = AnnualReport::for((int) $this->date->format('Y'));
    $march = $report['months'][2];

    expect($march['leaf_kg'])->toBe('1000.00')
        ->and($march['leaf_cost'])->toBe('20000.00')
        ->and($march['made_tea_kg'])->toBe('220.00')
        ->and($march['recovery'])->toBe('22.00')
        ->and($march['auction_revenue'])->toBe('49000.00')
        ->and($march['retail_revenue'])->toBe('3000.00')
        ->and($march['revenue'])->toBe('52000.00')
        ->and($march['costs'])->toBe('26000.00')
        ->and($march['result'])->toBe('26000.00')
        // ৳26,000 of costs over 220 kg of tea.
        ->and($march['cost_per_kg'])->toBe('118.18')
        ->and($report['months'][0]['cost_per_kg'])->toBeNull()
        ->and($report['totals']['result'])->toBe('26000.00')
        ->and($report['grades'][0])->toBe(['code' => 'PF', 'made_kg' => '220.00', 'auction_kg' => '200.00', 'average_price' => '250.00'])
        ->and($report['expenses_by_category'])->toBe([['name' => 'Electricity', 'total' => '6000.00']]);
});

test('the owner can open the reports page', function () {
    $this->actingAs(User::factory()->owner()->create())
        ->get(route('reports.index', ['year' => $this->date->format('Y')]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('reports/index')
            ->has('report.months', 12)
            ->where('report.totals.revenue', '52000.00')
            ->where('years.0', (int) now()->format('Y')));
});

test('the cash book lists money in and out by method', function () {
    $this->actingAs(User::factory()->owner()->create())
        ->get(route('cash-book.index', ['from' => $this->date->toDateString(), 'to' => $this->date->toDateString()]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('cash-book/index')
            ->has('book.entries', 4)
            // In: ৳1,000 cash from the customer + ৳49,000 auction into the bank.
            ->where('book.totals.in', '50000.00')
            // Out: ৳15,000 cash to the supplier + ৳6,000 electricity from the bank.
            ->where('book.totals.out', '21000.00')
            ->where('book.totals.net', '29000.00')
            ->where('book.by_method.0.method', 'cash')
            ->where('book.by_method.0.net', '-14000.00')
            ->where('book.by_method.1.method', 'bank')
            ->where('book.by_method.1.net', '43000.00'));

    $this->actingAs(User::factory()->owner()->create())
        ->get(route('cash-book.index', ['from' => $this->date->toDateString(), 'to' => $this->date->toDateString(), 'method' => 'cash']))
        ->assertInertia(fn ($page) => $page->has('book.entries', 2)->where('book.totals.net', '-14000.00'));
});

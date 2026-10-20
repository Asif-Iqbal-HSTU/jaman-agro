<?php

namespace App\Http\Controllers;

use App\Enums\StockMovementType;
use App\Models\Broker;
use App\Models\Customer;
use App\Models\ExpenseCategory;
use App\Models\PieceRate;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\TeaGrade;
use App\Models\Vehicle;
use App\Models\Warehouse;
use App\Models\Worker;
use Inertia\Inertia;
use Inertia\Response;

class SetupController extends Controller
{
    /**
     * The go-live checklist: everything to enter once before daily use starts.
     */
    public function __invoke(): Response
    {
        return Inertia::render('setup/index', [
            'counts' => [
                'grades' => TeaGrade::where('is_active', true)->count(),
                'suppliers' => Supplier::count(),
                'suppliers_with_opening' => Supplier::where('opening_balance', '!=', 0)->count(),
                'customers' => Customer::count(),
                'vehicles' => Vehicle::count(),
                'warehouses' => Warehouse::count(),
                'brokers' => Broker::count(),
                'workers' => Worker::count(),
                'piece_rates' => PieceRate::count(),
                'expense_categories' => ExpenseCategory::count(),
                'opening_stock_lines' => StockMovement::where('type', StockMovementType::Adjustment)->count(),
            ],
        ]);
    }
}

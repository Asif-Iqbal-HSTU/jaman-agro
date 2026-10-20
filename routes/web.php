<?php

use App\Http\Controllers\Admin\ActivityLogController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AuctionInvoiceController;
use App\Http\Controllers\BrokerController;
use App\Http\Controllers\CashBookController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\CustomerPaymentController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExpenseCategoryController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\LeafRateController;
use App\Http\Controllers\LeafReceiptController;
use App\Http\Controllers\LocaleController;
use App\Http\Controllers\PieceRateController;
use App\Http\Controllers\PieceWorkController;
use App\Http\Controllers\ProductionBatchController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\RetailSaleController;
use App\Http\Controllers\SetupController;
use App\Http\Controllers\StockController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\SupplierPaymentController;
use App\Http\Controllers\TeaGradeController;
use App\Http\Controllers\UnlockRequestController;
use App\Http\Controllers\VehicleController;
use App\Http\Controllers\WageController;
use App\Http\Controllers\WarehouseController;
use App\Http\Controllers\WorkerController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::put('locale', [LocaleController::class, 'update'])->name('locale.update');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    // Recording and correcting entries: the manager and admin.
    Route::middleware('role:admin,manager')->group(function () {
        Route::resource('suppliers', SupplierController::class)->only(['create', 'store', 'edit', 'update']);
        Route::resource('leaf-receipts', LeafReceiptController::class)->only(['create', 'store', 'edit', 'update', 'destroy']);
        Route::post('leaf-rates', [LeafRateController::class, 'store'])->name('leaf-rates.store');
        Route::resource('supplier-payments', SupplierPaymentController::class)->only(['create', 'store', 'edit', 'update', 'destroy']);
        Route::resource('production', ProductionBatchController::class)->only(['create', 'store', 'edit', 'update', 'destroy']);
        Route::get('stock/adjust', [StockController::class, 'createAdjustment'])->name('stock.adjust');
        Route::post('stock/adjust', [StockController::class, 'storeAdjustment'])->name('stock.adjust.store');
        Route::resource('grades', TeaGradeController::class)->only(['index', 'store', 'update']);
        Route::resource('brokers', BrokerController::class)->only(['index', 'store', 'update']);
        Route::resource('auction-invoices', AuctionInvoiceController::class)->only(['create', 'store', 'edit', 'update', 'destroy']);
        Route::resource('customers', CustomerController::class)->only(['create', 'store', 'edit', 'update']);
        Route::resource('retail-sales', RetailSaleController::class)->only(['create', 'store', 'destroy']);
        Route::resource('customer-payments', CustomerPaymentController::class)->only(['create', 'store', 'destroy']);
        Route::resource('expenses', ExpenseController::class)->only(['create', 'store', 'edit', 'update', 'destroy']);
        Route::resource('expense-categories', ExpenseCategoryController::class)->only(['index', 'store', 'update']);
        Route::resource('vehicles', VehicleController::class)->only(['index', 'store', 'update']);
        Route::resource('warehouses', WarehouseController::class)->only(['index', 'store', 'update']);
        Route::resource('workers', WorkerController::class)->only(['create', 'store', 'edit', 'update']);
        Route::post('attendance', [AttendanceController::class, 'store'])->name('attendance.store');
        Route::resource('piece-rates', PieceRateController::class)->only(['index', 'store', 'update']);
        Route::post('piece-work', [PieceWorkController::class, 'store'])->name('piece-work.store');
        Route::delete('piece-work/{pieceWork}', [PieceWorkController::class, 'destroy'])->name('piece-work.destroy');
        Route::post('wages/pay', [WageController::class, 'pay'])->name('wages.pay');
        Route::post('wages/bonus', [WageController::class, 'bonus'])->name('wages.bonus');
        Route::post('unlock-requests', [UnlockRequestController::class, 'store'])->name('unlock-requests.store');
        Route::get('setup', SetupController::class)->name('setup');
    });

    // Viewing: everyone, including the owner.
    Route::middleware('role:admin,manager,owner')->group(function () {
        Route::resource('suppliers', SupplierController::class)->only(['index', 'show']);
        Route::resource('leaf-receipts', LeafReceiptController::class)->only(['index', 'show']);
        Route::resource('supplier-payments', SupplierPaymentController::class)->only(['index']);
        Route::resource('production', ProductionBatchController::class)->only(['index']);
        Route::get('stock', [StockController::class, 'index'])->name('stock.index');
        Route::resource('auction-invoices', AuctionInvoiceController::class)->only(['index']);
        Route::resource('customers', CustomerController::class)->only(['index', 'show']);
        Route::resource('retail-sales', RetailSaleController::class)->only(['index', 'show']);
        Route::resource('expenses', ExpenseController::class)->only(['index']);
        Route::get('cash-book', CashBookController::class)->name('cash-book.index');
        Route::get('reports', ReportController::class)->name('reports.index');
        Route::resource('workers', WorkerController::class)->only(['index']);
        Route::get('attendance', [AttendanceController::class, 'index'])->name('attendance.index');
        Route::get('piece-work', [PieceWorkController::class, 'index'])->name('piece-work.index');
        Route::get('wages', [WageController::class, 'index'])->name('wages.index');
    });

    Route::middleware('role:admin')->prefix('admin')->name('admin.')->group(function () {
        Route::resource('users', UserController::class)->except(['show', 'destroy']);
        Route::get('activity-log', [ActivityLogController::class, 'index'])->name('activity-log.index');
        Route::get('unlock-requests', [UnlockRequestController::class, 'index'])->name('unlock-requests.index');
        Route::put('unlock-requests/{unlockRequest}', [UnlockRequestController::class, 'update'])->name('unlock-requests.update');
    });
});

require __DIR__.'/settings.php';

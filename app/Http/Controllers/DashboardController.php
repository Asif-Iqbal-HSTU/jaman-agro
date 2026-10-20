<?php

namespace App\Http\Controllers;

use App\Models\AuctionInvoice;
use App\Models\Customer;
use App\Models\LeafRate;
use App\Models\LeafReceipt;
use App\Models\ProductionBatch;
use App\Models\RetailSale;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Support\Decimal;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\Date;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Today's leaf intake, the last week at a glance and what is owed to suppliers.
     */
    public function __invoke(): Response
    {
        $today = Date::today();

        $todayReceipts = LeafReceipt::whereDate('received_on', $today)->get(['supplier_id', 'net_kg', 'amount']);

        $week = LeafReceipt::query()
            ->whereDate('received_on', '>=', $today->subDays(6))
            ->get(['received_on', 'net_kg', 'amount'])
            ->groupBy(fn (LeafReceipt $r) => $r->received_on->toDateString());

        return Inertia::render('dashboard', [
            'today' => [
                'date' => $today->toDateString(),
                'deliveries' => $todayReceipts->count(),
                'suppliers' => $todayReceipts->pluck('supplier_id')->unique()->count(),
                'net_kg' => Decimal::add(...$todayReceipts->pluck('net_kg')->all()),
                'amount' => Decimal::add(...$todayReceipts->pluck('amount')->all()),
                'rate' => LeafRate::forDate($today)?->rate,
            ],
            'week' => collect(range(6, 0))->map(function (int $daysAgo) use ($today, $week) {
                $date = $today->subDays($daysAgo)->toDateString();
                $receipts = $week->get($date, collect());

                return [
                    'date' => $date,
                    'net_kg' => Decimal::add(...$receipts->pluck('net_kg')->all()),
                    'amount' => Decimal::add(...$receipts->pluck('amount')->all()),
                ];
            })->all(),
            'balances' => Supplier::balanceSummary(),
            'production' => $this->productionThisMonth($today),
            'stockKg' => Decimal::add(...array_values(StockMovement::balances())),
            'sales' => $this->salesThisMonth($today),
            'supplierCount' => Supplier::where('is_active', true)->count(),
        ]);
    }

    /**
     * Auction and retail sales for the month so far, and money still to come in.
     *
     * @return array<string, string>
     */
    private function salesThisMonth(CarbonInterface $today): array
    {
        $auction = AuctionInvoice::query()->whereNotNull('price_per_kg')->whereDate('sold_on', '>=', $today->startOfMonth());
        $retail = RetailSale::query()->whereDate('sold_on', '>=', $today->startOfMonth());

        return [
            'auction_kg' => Decimal::add((clone $auction)->sum('net_kg')),
            'auction_amount' => Decimal::add((clone $auction)->sum('net_amount')),
            'retail_amount' => Decimal::add($retail->sum('total_amount')),
            'auction_due' => Decimal::add(AuctionInvoice::query()->status('sold')->sum('net_amount')),
            'customers_due' => Customer::totalReceivable(),
        ];
    }

    /**
     * Made tea and recovery for the month so far.
     *
     * @return array{green_leaf_kg: string, made_tea_kg: string, recovery: string|null}
     */
    private function productionThisMonth(CarbonInterface $today): array
    {
        $batches = ProductionBatch::query()
            ->whereDate('produced_on', '>=', $today->startOfMonth())
            ->withSum('outputs as made_tea_kg', 'kg')
            ->get(['id', 'green_leaf_kg']);

        $greenLeaf = Decimal::add(...$batches->pluck('green_leaf_kg')->all());
        $madeTea = Decimal::add(...$batches->pluck('made_tea_kg')->all());

        return [
            'green_leaf_kg' => $greenLeaf,
            'made_tea_kg' => $madeTea,
            'recovery' => ProductionBatch::recovery($madeTea, $greenLeaf),
        ];
    }
}

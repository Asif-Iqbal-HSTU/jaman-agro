<?php

namespace App\Services;

use App\Enums\ExpenseKind;
use App\Models\Attendance;
use App\Models\AuctionInvoice;
use App\Models\Expense;
use App\Models\LeafReceipt;
use App\Models\PieceWork;
use App\Models\ProductionBatch;
use App\Models\ProductionOutput;
use App\Models\RetailSale;
use App\Models\TeaGrade;
use App\Models\WageBonus;
use App\Support\Decimal;
use Illuminate\Support\Collection;

/**
 * A year at a glance, month by month: leaf bought, tea made, money in and
 * money out. The result is a simple cash view (sales less leaf and running
 * costs); it does not value tea still in stock.
 */
final class AnnualReport
{
    /**
     * The monthly figures summed straight from the records; the rest are worked out from these.
     */
    private const STORED = [
        'leaf_kg', 'leaf_cost', 'green_leaf_used_kg', 'made_tea_kg',
        'auction_kg', 'auction_revenue', 'retail_revenue', 'expenses', 'transport_cost', 'wages',
    ];

    /**
     * @return array<string, mixed>
     */
    public static function for(int $year): array
    {
        $inYear = fn ($query, string $column) => $query->whereYear($column, $year);
        $month = fn ($date) => (int) $date->format('n');

        $leaf = LeafReceipt::query()->tap(fn ($q) => $inYear($q, 'received_on'))->get(['received_on', 'net_kg', 'amount']);
        $batches = ProductionBatch::query()->tap(fn ($q) => $inYear($q, 'produced_on'))
            ->withSum('outputs as made_tea_kg', 'kg')
            ->get(['id', 'produced_on', 'green_leaf_kg']);
        $auction = AuctionInvoice::query()->whereNotNull('price_per_kg')->tap(fn ($q) => $inYear($q, 'sold_on'))
            ->get(['sold_on', 'tea_grade_id', 'net_kg', 'gross_amount', 'net_amount']);
        $retail = RetailSale::query()->tap(fn ($q) => $inYear($q, 'sold_on'))->get(['sold_on', 'total_amount']);
        $expenses = Expense::query()->with('category:id,name,kind')->tap(fn ($q) => $inYear($q, 'spent_on'))
            ->get(['spent_on', 'expense_category_id', 'amount']);
        // Vehicle running costs are the cost of bringing leaf in; everything else is factory cost.
        [$vehicleExpenses, $factoryExpenses] = $expenses->partition(fn (Expense $e) => $e->category?->kind === ExpenseKind::Vehicle);
        // Wages are counted on the day the work was done.
        $wages = collect()
            ->concat(Attendance::query()->tap(fn ($q) => $inYear($q, 'work_date'))->get(['work_date', 'amount'])
                ->map(fn (Attendance $a) => (object) ['work_date' => $a->work_date, 'amount' => $a->amount]))
            ->concat(PieceWork::query()->tap(fn ($q) => $inYear($q, 'work_date'))->get(['work_date', 'amount'])
                ->map(fn (PieceWork $p) => (object) ['work_date' => $p->work_date, 'amount' => $p->amount]))
            ->concat(WageBonus::query()->tap(fn ($q) => $inYear($q, 'given_on'))->get(['given_on', 'amount'])
                ->map(fn (WageBonus $b) => (object) ['work_date' => $b->given_on, 'amount' => $b->amount]));

        $months = collect(range(1, 12))->map(function (int $m) use ($leaf, $batches, $auction, $retail, $factoryExpenses, $vehicleExpenses, $wages, $month, $year) {
            $sum = fn (Collection $rows, string $date, string $column) => Decimal::add(
                ...$rows->filter(fn ($row) => $month($row->{$date}) === $m)->pluck($column)->all()
            );

            $row = [
                'month' => sprintf('%d-%02d', $year, $m),
                'leaf_kg' => $sum($leaf, 'received_on', 'net_kg'),
                'leaf_cost' => $sum($leaf, 'received_on', 'amount'),
                'green_leaf_used_kg' => $sum($batches, 'produced_on', 'green_leaf_kg'),
                'made_tea_kg' => $sum($batches, 'produced_on', 'made_tea_kg'),
                'auction_kg' => $sum($auction, 'sold_on', 'net_kg'),
                'auction_revenue' => $sum($auction, 'sold_on', 'net_amount'),
                'retail_revenue' => $sum($retail, 'sold_on', 'total_amount'),
                'expenses' => $sum($factoryExpenses, 'spent_on', 'amount'),
                'transport_cost' => $sum($vehicleExpenses, 'spent_on', 'amount'),
                'wages' => $sum($wages, 'work_date', 'amount'),
            ];

            return self::withDerived($row);
        });

        $totals = [];

        foreach (self::STORED as $key) {
            $totals[$key] = Decimal::add(...$months->pluck($key)->all());
        }

        $totals = self::withDerived($totals);

        return [
            'year' => $year,
            'months' => $months->all(),
            'totals' => $totals,
            'grades' => self::grades($year, $auction),
            'expenses_by_category' => $expenses
                ->groupBy(fn (Expense $e) => $e->category->name ?? '')
                ->map(fn (Collection $rows, string $name) => ['name' => $name, 'total' => Decimal::add(...$rows->pluck('amount')->all())])
                ->sortByDesc(fn ($row) => (float) $row['total'])
                ->values()
                ->all(),
        ];
    }

    /**
     * Years that have any data, newest first, always including this year.
     *
     * @return list<int>
     */
    public static function years(): array
    {
        $first = collect([
            LeafReceipt::min('received_on'),
            ProductionBatch::min('produced_on'),
            AuctionInvoice::min('sold_on'),
            RetailSale::min('sold_on'),
            Expense::min('spent_on'),
        ])->filter()->map(fn ($date) => (int) substr((string) $date, 0, 4))->min();

        $current = (int) now()->format('Y');

        return range($current, min($first ?? $current, $current));
    }

    /**
     * Add the figures worked out from the stored ones.
     *
     * @param  array<string, mixed>  $row
     * @return array<string, mixed>
     */
    private static function withDerived(array $row): array
    {
        $revenue = Decimal::add($row['auction_revenue'], $row['retail_revenue']);
        $costs = Decimal::add($row['leaf_cost'], $row['transport_cost'], $row['expenses'], $row['wages']);
        $hasTea = Decimal::compare($row['made_tea_kg'], 0) > 0;
        $hasLeaf = Decimal::compare($row['leaf_kg'], 0) > 0;

        return [
            ...$row,
            // What a kg of green leaf really cost: its price plus the cost of bringing it in.
            'landed_leaf_cost_per_kg' => $hasLeaf ? Decimal::div(Decimal::add($row['leaf_cost'], $row['transport_cost']), $row['leaf_kg']) : null,
            'recovery' => ProductionBatch::recovery($row['made_tea_kg'], $row['green_leaf_used_kg']),
            'revenue' => $revenue,
            'costs' => $costs,
            'result' => Decimal::sub($revenue, $costs),
            'cost_per_kg' => $hasTea ? Decimal::div($costs, $row['made_tea_kg']) : null,
        ];
    }

    /**
     * Made tea and auction price per grade for the year.
     *
     * @param  Collection<int, AuctionInvoice>  $auction
     * @return list<array{code: string, made_kg: string, auction_kg: string, average_price: string|null}>
     */
    private static function grades(int $year, Collection $auction): array
    {
        $made = ProductionOutput::query()
            ->join('production_batches', 'production_batches.id', '=', 'production_outputs.production_batch_id')
            ->whereYear('production_batches.produced_on', $year)
            ->toBase()
            ->selectRaw('production_outputs.tea_grade_id, SUM(production_outputs.kg) as kg')
            ->groupBy('production_outputs.tea_grade_id')
            ->pluck('kg', 'tea_grade_id');

        return array_values(TeaGrade::ordered()->get(['id', 'code'])
            ->map(function (TeaGrade $grade) use ($made, $auction) {
                $sold = $auction->where('tea_grade_id', $grade->id);
                $soldKg = Decimal::add(...$sold->pluck('net_kg')->all());

                return [
                    'code' => $grade->code,
                    'made_kg' => Decimal::add($made[$grade->id] ?? 0),
                    'auction_kg' => $soldKg,
                    'average_price' => Decimal::compare($soldKg, 0) > 0
                        ? Decimal::div(Decimal::add(...$sold->pluck('gross_amount')->all()), $soldKg)
                        : null,
                ];
            })
            ->filter(fn (array $g) => Decimal::compare($g['made_kg'], 0) > 0 || Decimal::compare($g['auction_kg'], 0) > 0)
            ->all());
    }
}

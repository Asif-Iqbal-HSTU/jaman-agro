<?php

namespace App\Actions\Sales;

use App\Enums\StockMovementType;
use App\Models\RetailSale;
use App\Models\RetailSaleItem;
use App\Models\StockMovement;
use App\Support\Decimal;
use Illuminate\Support\Facades\DB;

/**
 * Records a retail sale memo: its grades come out of stock, and any money
 * taken on the spot is booked as a customer payment linked to the sale.
 */
class RecordRetailSale
{
    /**
     * @param  array{sold_on: string, customer_id: int|null, notes: string|null, recorded_by: int}  $sale
     * @param  list<array{tea_grade_id: int, kg: string, rate: string}>  $items
     * @param  array{amount: string, method: string, reference: string|null}|null  $payment
     */
    public function handle(array $sale, array $items, ?array $payment): RetailSale
    {
        return DB::transaction(function () use ($sale, $items, $payment) {
            $retailSale = RetailSale::create([
                ...$sale,
                'total_amount' => Decimal::add(...array_map(fn ($item) => Decimal::mul($item['kg'], $item['rate']), $items)),
            ]);

            foreach ($items as $item) {
                $line = $retailSale->items()->create($item);

                $line->stockMovement()->create([
                    'moved_on' => $sale['sold_on'],
                    'tea_grade_id' => $line->tea_grade_id,
                    'quantity_kg' => Decimal::sub(0, $line->kg),
                    'type' => StockMovementType::Retail,
                    'reason' => $retailSale->number,
                    'recorded_by' => $sale['recorded_by'],
                ]);
            }

            if ($payment !== null && Decimal::compare($payment['amount'], 0) > 0) {
                $retailSale->payment()->create([
                    ...$payment,
                    'paid_on' => $sale['sold_on'],
                    'customer_id' => $sale['customer_id'],
                    'recorded_by' => $sale['recorded_by'],
                ]);
            }

            StockMovement::ensureNotNegative(array_column($items, 'tea_grade_id'), 'items');

            return $retailSale;
        });
    }

    /**
     * Cancel a sale entered by mistake: the tea goes back into stock and the
     * money taken with it is removed.
     */
    public function delete(RetailSale $sale): void
    {
        DB::transaction(function () use ($sale) {
            StockMovement::query()
                ->where('source_type', (new RetailSaleItem)->getMorphClass())
                ->whereIn('source_id', $sale->items()->pluck('id'))
                ->delete();

            $sale->payment?->delete();
            $sale->items()->get()->each->delete();
            $sale->delete();
        });
    }
}

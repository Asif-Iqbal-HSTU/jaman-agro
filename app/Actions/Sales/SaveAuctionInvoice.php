<?php

namespace App\Actions\Sales;

use App\Enums\StockMovementType;
use App\Models\AuctionInvoice;
use App\Models\StockMovement;
use App\Support\Decimal;
use Illuminate\Support\Facades\DB;

/**
 * Saves an auction invoice; packing it takes its tea out of the made tea stock.
 */
class SaveAuctionInvoice
{
    /**
     * @param  array<string, mixed>  $attributes
     */
    public function handle(AuctionInvoice $invoice, array $attributes): AuctionInvoice
    {
        return DB::transaction(function () use ($invoice, $attributes) {
            $previousGradeId = $invoice->exists ? $invoice->tea_grade_id : null;

            $invoice->fill($attributes)->save();

            $invoice->stockMovement()->updateOrCreate([], [
                'moved_on' => $invoice->packed_on->toDateString(),
                'tea_grade_id' => $invoice->tea_grade_id,
                'quantity_kg' => Decimal::sub(0, $invoice->net_kg),
                'type' => StockMovementType::Auction,
                'reason' => $invoice->invoice_no,
                'recorded_by' => $invoice->recorded_by,
            ]);

            StockMovement::ensureNotNegative(array_filter([$previousGradeId, $invoice->tea_grade_id]), 'packages');

            return $invoice;
        });
    }

    /**
     * Remove an invoice that was packed by mistake; its tea goes back into stock.
     */
    public function delete(AuctionInvoice $invoice): void
    {
        DB::transaction(function () use ($invoice) {
            $invoice->stockMovement()->delete();
            $invoice->delete();
        });
    }
}

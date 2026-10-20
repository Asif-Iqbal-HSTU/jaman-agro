<?php

namespace App\Actions\Production;

use App\Enums\StockMovementType;
use App\Models\ProductionBatch;
use App\Models\StockMovement;
use App\Support\Decimal;
use Illuminate\Support\Facades\DB;

/**
 * Saves a batch with its grade outputs and keeps the made tea stock in step:
 * each grade output becomes one production line in the stock ledger.
 */
class SaveProductionBatch
{
    /**
     * @param  array<string, mixed>  $attributes
     * @param  array<int, string|int|float|null>  $outputs  kg keyed by tea grade id
     */
    public function handle(ProductionBatch $batch, array $attributes, array $outputs): ProductionBatch
    {
        return DB::transaction(function () use ($batch, $attributes, $outputs) {
            $before = $batch->exists ? $batch->outputs()->pluck('tea_grade_id')->map(intval(...))->all() : [];

            $batch->fill($attributes)->save();

            foreach ($outputs as $gradeId => $kg) {
                if (Decimal::compare($kg, 0) <= 0) {
                    $this->removeGrade($batch, $gradeId);

                    continue;
                }

                $batch->outputs()->updateOrCreate(['tea_grade_id' => $gradeId], ['kg' => $kg]);
                $batch->stockMovements()->updateOrCreate(
                    ['tea_grade_id' => $gradeId],
                    [
                        'moved_on' => $batch->produced_on->toDateString(),
                        'quantity_kg' => $kg,
                        'type' => StockMovementType::Production,
                        'recorded_by' => $batch->recorded_by,
                    ],
                );
            }

            // Grades that had output before but were left out this time.
            foreach (array_diff($before, array_keys($outputs)) as $gradeId) {
                $this->removeGrade($batch, $gradeId);
            }

            // The ledger follows the batch date, also when the batch is moved to another day.
            $batch->stockMovements()->update(['moved_on' => $batch->produced_on->toDateString()]);

            StockMovement::ensureNotNegative([...$before, ...array_keys($outputs)]);

            return $batch;
        });
    }

    /**
     * Delete a batch and take its tea back out of stock.
     */
    public function delete(ProductionBatch $batch): void
    {
        DB::transaction(function () use ($batch) {
            $gradeIds = $batch->outputs()->pluck('tea_grade_id')->map(intval(...))->all();

            $batch->stockMovements()->delete();
            $batch->outputs()->get()->each->delete();
            $batch->delete();

            StockMovement::ensureNotNegative($gradeIds);
        });
    }

    private function removeGrade(ProductionBatch $batch, int $gradeId): void
    {
        $batch->outputs()->where('tea_grade_id', $gradeId)->get()->each->delete();
        $batch->stockMovements()->where('tea_grade_id', $gradeId)->delete();
    }
}

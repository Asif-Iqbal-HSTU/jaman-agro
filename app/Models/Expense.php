<?php

namespace App\Models;

use App\Concerns\HasEditLock;
use App\Concerns\MarksEdited;
use App\Concerns\RecordsActivity;
use App\Enums\PaymentMethod;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Money the factory spent on running costs.
 *
 * @property int $id
 * @property CarbonImmutable $spent_on
 * @property int $expense_category_id
 * @property int|null $vehicle_id
 * @property string $amount
 * @property PaymentMethod $method
 * @property string|null $paid_to
 * @property string|null $reference
 * @property string|null $notes
 * @property int|null $recorded_by
 * @property CarbonImmutable|null $edited_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
#[Fillable(['spent_on', 'expense_category_id', 'vehicle_id', 'amount', 'method', 'paid_to', 'reference', 'notes', 'recorded_by'])]
class Expense extends Model
{
    use HasEditLock, MarksEdited, RecordsActivity;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'spent_on' => 'date:Y-m-d',
            'amount' => 'decimal:2',
            'edited_at' => 'datetime',
            'method' => PaymentMethod::class,
        ];
    }

    /**
     * The factory vehicle this was spent on (fuel, driver, repairs), if any.
     *
     * @return BelongsTo<Vehicle, $this>
     */
    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    /**
     * @return BelongsTo<ExpenseCategory, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(ExpenseCategory::class, 'expense_category_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}

<?php

namespace App\Models;

use App\Concerns\HasEditLock;
use App\Concerns\MarksEdited;
use App\Concerns\RecordsActivity;
use App\Enums\PaymentMethod;
use App\Enums\PaymentType;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Money paid to a supplier, either against leaf delivered or as an advance.
 *
 * @property int $id
 * @property CarbonImmutable $paid_on
 * @property int $supplier_id
 * @property PaymentType $type
 * @property PaymentMethod $method
 * @property string $amount
 * @property string|null $reference
 * @property string|null $notes
 * @property int|null $recorded_by
 * @property CarbonImmutable|null $edited_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
#[Fillable(['paid_on', 'supplier_id', 'type', 'method', 'amount', 'reference', 'notes', 'recorded_by'])]
class SupplierPayment extends Model
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
            'paid_on' => 'date:Y-m-d',
            'type' => PaymentType::class,
            'method' => PaymentMethod::class,
            'amount' => 'decimal:2',
            'edited_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Supplier, $this>
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}

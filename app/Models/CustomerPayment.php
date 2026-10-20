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
 * Money received from a retail customer, at a sale or later.
 *
 * @property int $id
 * @property CarbonImmutable $paid_on
 * @property int|null $customer_id
 * @property int|null $retail_sale_id
 * @property string $amount
 * @property PaymentMethod $method
 * @property string|null $reference
 * @property string|null $notes
 * @property int|null $recorded_by
 * @property CarbonImmutable|null $edited_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
#[Fillable(['paid_on', 'customer_id', 'retail_sale_id', 'amount', 'method', 'reference', 'notes', 'recorded_by'])]
class CustomerPayment extends Model
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
            'amount' => 'decimal:2',
            'edited_at' => 'datetime',
            'method' => PaymentMethod::class,
        ];
    }

    /**
     * @return BelongsTo<Customer, $this>
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * @return BelongsTo<RetailSale, $this>
     */
    public function sale(): BelongsTo
    {
        return $this->belongsTo(RetailSale::class, 'retail_sale_id');
    }
}

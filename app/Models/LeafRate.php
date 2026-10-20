<?php

namespace App\Models;

use App\Concerns\HasEditLock;
use App\Concerns\MarksEdited;
use App\Concerns\RecordsActivity;
use App\Enums\DeliveryMode;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;

/**
 * The price per kg of green leaf for one day: the rate for leaf the supplier
 * brings to the factory, and the lower site rate for leaf a factory vehicle collects.
 *
 * @property int $id
 * @property CarbonImmutable $rate_date
 * @property string $rate
 * @property string|null $site_rate
 * @property int|null $set_by
 * @property CarbonImmutable|null $edited_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
#[Fillable(['rate_date', 'rate', 'site_rate', 'set_by'])]
class LeafRate extends Model
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
            'rate_date' => 'date:Y-m-d',
            'rate' => 'decimal:2',
            'site_rate' => 'decimal:2',
            'edited_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        // Price every delivery of that day at the new rate.
        static::saved(fn (LeafRate $rate) => $rate->applyToReceipts());
    }

    /**
     * Find the rate for a given day, if one has been set.
     */
    public static function forDate(CarbonInterface|string $date): ?self
    {
        return self::whereDate('rate_date', $date)->first();
    }

    /**
     * The price per kg for leaf that arrived this way. Leaf collected by a
     * factory vehicle waits until the site rate is set.
     */
    public function rateFor(DeliveryMode $mode): ?string
    {
        return $mode === DeliveryMode::FactoryVehicle ? $this->site_rate : $this->rate;
    }

    /**
     * Re-price every receipt on this rate's day.
     */
    public function applyToReceipts(): void
    {
        DB::transaction(function () {
            LeafReceipt::whereDate('received_on', $this->rate_date)
                ->get()
                ->each(function (LeafReceipt $receipt) {
                    $receipt->rate = $this->rateFor($receipt->delivery_mode);
                    $receipt->calculate();
                    $receipt->saveQuietly();
                });
        });
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function setter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'set_by');
    }
}

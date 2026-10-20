<?php

namespace App\Models;

use App\Concerns\RecordsActivity;
use App\Enums\WorkerPayType;
use App\Support\Decimal;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A person or contract crew paid by the factory.
 *
 * @property int $id
 * @property string $name
 * @property string|null $phone
 * @property WorkerPayType $pay_type
 * @property string|null $hourly_rate
 * @property bool $is_active
 * @property string|null $notes
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property string|null $hours_earned
 * @property string|null $piece_earned
 * @property string|null $bonus_earned
 * @property string|null $paid_amount
 */
#[Fillable(['name', 'phone', 'pay_type', 'hourly_rate', 'is_active', 'notes'])]
class Worker extends Model
{
    use RecordsActivity;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'pay_type' => WorkerPayType::class,
            'hourly_rate' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return HasMany<Attendance, $this>
     */
    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    /**
     * @return HasMany<PieceWork, $this>
     */
    public function pieceWorks(): HasMany
    {
        return $this->hasMany(PieceWork::class);
    }

    /**
     * @return HasMany<WageBonus, $this>
     */
    public function bonuses(): HasMany
    {
        return $this->hasMany(WageBonus::class);
    }

    /**
     * @return HasMany<WagePayment, $this>
     */
    public function payments(): HasMany
    {
        return $this->hasMany(WagePayment::class);
    }

    /**
     * Load everything earned and paid, to work out what is still owed.
     *
     * @param  Builder<Worker>  $query
     */
    public function scopeWithWageTotals(Builder $query): void
    {
        $query->withSum('attendances as hours_earned', 'amount')
            ->withSum('pieceWorks as piece_earned', 'amount')
            ->withSum('bonuses as bonus_earned', 'amount')
            ->withSum('payments as paid_amount', 'amount');
    }

    /**
     * What the factory owes this worker now. Requires the withWageTotals() scope.
     *
     * @return numeric-string
     */
    public function owed(): string
    {
        return Decimal::sub(Decimal::add($this->hours_earned, $this->piece_earned, $this->bonus_earned), $this->paid_amount);
    }
}

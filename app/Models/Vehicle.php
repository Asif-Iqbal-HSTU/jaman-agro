<?php

namespace App\Models;

use App\Concerns\RecordsActivity;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A factory truck or van that collects leaf from the gardens.
 *
 * @property int $id
 * @property string $name
 * @property string|null $registration_no
 * @property string|null $driver_name
 * @property string|null $driver_phone
 * @property bool $is_active
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
#[Fillable(['name', 'registration_no', 'driver_name', 'driver_phone', 'is_active'])]
class Vehicle extends Model
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
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return HasMany<LeafReceipt, $this>
     */
    public function leafReceipts(): HasMany
    {
        return $this->hasMany(LeafReceipt::class);
    }

    /**
     * @return HasMany<Expense, $this>
     */
    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }
}

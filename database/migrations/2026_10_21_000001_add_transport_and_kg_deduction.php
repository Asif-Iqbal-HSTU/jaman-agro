<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // The factory's own trucks and vans that collect leaf.
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('registration_no', 30)->nullable()->unique();
            $table->string('driver_name')->nullable();
            $table->string('driver_phone', 20)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::table('leaf_receipts', function (Blueprint $table) {
            // How the leaf reached the factory: brought by the supplier, or collected by a factory vehicle.
            $table->string('delivery_mode', 20)->default('supplier')->after('supplier_id');
            $table->foreignId('vehicle_id')->nullable()->after('delivery_mode')->constrained()->restrictOnDelete();
            // Moisture can be taken off as a fixed kg or as a percentage.
            $table->string('deduction_type', 10)->default('percent')->after('tare_kg');
            $table->decimal('deduction_percent', 5, 2)->nullable()->default(null)->change();
        });

        Schema::table('leaf_rates', function (Blueprint $table) {
            // Lower price paid at the garden when a factory vehicle collects the leaf.
            $table->decimal('site_rate', 8, 2)->nullable()->after('rate');
        });

        Schema::table('expense_categories', function (Blueprint $table) {
            // "factory" or "vehicle": the two kinds of spending the factory keeps apart.
            $table->string('kind', 10)->default('factory')->after('name');
        });

        Schema::table('expenses', function (Blueprint $table) {
            $table->foreignId('vehicle_id')->nullable()->after('expense_category_id')->constrained()->restrictOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->dropConstrainedForeignId('vehicle_id');
        });
        Schema::table('expense_categories', fn (Blueprint $table) => $table->dropColumn('kind'));
        Schema::table('leaf_rates', fn (Blueprint $table) => $table->dropColumn('site_rate'));
        Schema::table('leaf_receipts', function (Blueprint $table) {
            $table->dropConstrainedForeignId('vehicle_id');
            $table->dropColumn(['delivery_mode', 'deduction_type']);
        });
        Schema::dropIfExists('vehicles');
    }
};

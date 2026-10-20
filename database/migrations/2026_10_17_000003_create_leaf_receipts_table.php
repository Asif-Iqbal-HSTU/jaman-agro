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
        Schema::create('leaf_receipts', function (Blueprint $table) {
            $table->id();
            $table->date('received_on')->index();
            $table->foreignId('supplier_id')->constrained()->restrictOnDelete();
            $table->string('vehicle_no', 30)->nullable();
            $table->decimal('gross_kg', 10, 2);
            $table->decimal('tare_kg', 10, 2)->default(0);
            $table->decimal('deduction_percent', 5, 2)->default(0);
            $table->decimal('deduction_kg', 10, 2);
            $table->decimal('net_kg', 10, 2);
            // Copied from the day's leaf rate; null until the rate for that day is set.
            $table->decimal('rate', 8, 2)->nullable();
            $table->decimal('amount', 12, 2)->nullable();
            $table->string('notes')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['supplier_id', 'received_on']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leaf_receipts');
    }
};

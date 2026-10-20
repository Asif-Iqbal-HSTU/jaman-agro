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
        // The made tea ledger: stock of a grade is the sum of its movements.
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->date('moved_on')->index();
            $table->foreignId('tea_grade_id')->constrained()->restrictOnDelete();
            // Positive adds to stock, negative takes from it.
            $table->decimal('quantity_kg', 12, 2);
            $table->string('type', 20);
            $table->nullableMorphs('source');
            $table->string('reason')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['tea_grade_id', 'moved_on']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};

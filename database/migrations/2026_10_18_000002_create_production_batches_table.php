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
        Schema::create('production_batches', function (Blueprint $table) {
            $table->id();
            $table->date('produced_on')->index();
            $table->decimal('green_leaf_kg', 10, 2);
            $table->decimal('withering_hours', 4, 1)->nullable();
            $table->unsignedSmallInteger('fermentation_minutes')->nullable();
            $table->unsignedSmallInteger('dryer_temp_c')->nullable();
            $table->string('notes')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // Made tea sorted out of a batch, one row per grade.
        Schema::create('production_outputs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('production_batch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tea_grade_id')->constrained()->restrictOnDelete();
            $table->decimal('kg', 10, 2);
            $table->timestamps();

            $table->unique(['production_batch_id', 'tea_grade_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('production_outputs');
        Schema::dropIfExists('production_batches');
    }
};

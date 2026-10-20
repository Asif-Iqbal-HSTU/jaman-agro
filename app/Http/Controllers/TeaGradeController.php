<?php

namespace App\Http\Controllers;

use App\Models\TeaGrade;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TeaGradeController extends Controller
{
    /**
     * List the grades the factory sorts its tea into.
     */
    public function index(): Response
    {
        return Inertia::render('grades/index', [
            'grades' => TeaGrade::ordered()->get(),
        ]);
    }

    /**
     * Add a grade.
     */
    public function store(Request $request): RedirectResponse
    {
        TeaGrade::create($this->validated($request));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Grade saved.')]);

        return to_route('grades.index');
    }

    /**
     * Rename, reorder or switch off a grade.
     */
    public function update(Request $request, TeaGrade $grade): RedirectResponse
    {
        $grade->update($this->validated($request, $grade));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Grade saved.')]);

        return to_route('grades.index');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?TeaGrade $grade = null): array
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:20', Rule::unique(TeaGrade::class)->ignore($grade?->id)],
            'name' => ['nullable', 'string', 'max:100'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'is_active' => ['boolean'],
        ]);

        return [...$validated, 'sort_order' => $validated['sort_order'] ?? 0];
    }
}

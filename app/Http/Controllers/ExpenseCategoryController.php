<?php

namespace App\Http\Controllers;

use App\Enums\ExpenseKind;
use App\Models\ExpenseCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ExpenseCategoryController extends Controller
{
    /**
     * List the headings expenses are booked under.
     */
    public function index(): Response
    {
        return Inertia::render('expense-categories/index', [
            'categories' => ExpenseCategory::ordered()->get(),
            'kinds' => ExpenseKind::options(),
        ]);
    }

    /**
     * Add a category.
     */
    public function store(Request $request): RedirectResponse
    {
        ExpenseCategory::create($this->validated($request));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Category saved.')]);

        return to_route('expense-categories.index');
    }

    /**
     * Rename, reorder or switch off a category.
     */
    public function update(Request $request, ExpenseCategory $expenseCategory): RedirectResponse
    {
        $expenseCategory->update($this->validated($request, $expenseCategory));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Category saved.')]);

        return to_route('expense-categories.index');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?ExpenseCategory $category = null): array
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', Rule::unique(ExpenseCategory::class)->ignore($category?->id)],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'kind' => ['required', Rule::enum(ExpenseKind::class)],
            'is_active' => ['boolean'],
        ]);

        return [...$validated, 'sort_order' => $validated['sort_order'] ?? 0];
    }
}

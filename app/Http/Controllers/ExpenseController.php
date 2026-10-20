<?php

namespace App\Http\Controllers;

use App\Enums\ExpenseKind;
use App\Enums\PaymentMethod;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Vehicle;
use App\Support\Decimal;
use App\Support\EditLock;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ExpenseController extends Controller
{
    /**
     * A month of factory expenses, with totals per category.
     */
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'month' => ['nullable', 'date_format:Y-m'],
            'category' => ['nullable', 'integer'],
        ]);

        $start = isset($validated['month'])
            ? Date::createFromFormat('Y-m-d', $validated['month'].'-01')->startOfDay()
            : Date::today()->startOfMonth();

        $month = Expense::query()
            ->whereDate('spent_on', '>=', $start)
            ->whereDate('spent_on', '<=', $start->endOfMonth());

        $byCategory = (clone $month)->toBase()
            ->selectRaw('expense_category_id, SUM(amount) as total')
            ->groupBy('expense_category_id')
            ->pluck('total', 'expense_category_id');

        return Inertia::render('expenses/index', [
            'month' => $start->format('Y-m'),
            'expenses' => (clone $month)
                ->with('category:id,name,kind', 'recorder:id,name', 'vehicle:id,name')
                ->when($validated['category'] ?? null, fn ($query, $id) => $query->where('expense_category_id', $id))
                ->orderByDesc('spent_on')->orderByDesc('id')
                ->paginate(30)
                ->withQueryString(),
            'categories' => ExpenseCategory::ordered()->get(['id', 'name', 'kind', 'is_active'])
                ->map(fn (ExpenseCategory $c) => [
                    ...$c->only('id', 'name', 'kind', 'is_active'),
                    'total' => Decimal::add($byCategory[$c->id] ?? 0),
                ]),
            'total' => Decimal::add(...$byCategory->values()->all()),
            'filters' => ['category' => $validated['category'] ?? null],
        ]);
    }

    /**
     * Show the form for recording an expense.
     */
    public function create(): Response
    {
        return Inertia::render('expenses/create', [
            ...$this->formOptions(),
            'today' => Date::today()->toDateString(),
        ]);
    }

    /**
     * Record an expense.
     */
    public function store(Request $request): RedirectResponse
    {
        $expense = Expense::create([...$this->validated($request), 'recorded_by' => $request->user()->id]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Expense recorded.')]);

        return to_route('expenses.index', ['month' => $expense->spent_on->format('Y-m')]);
    }

    /**
     * Show the form for correcting an expense.
     */
    public function edit(Expense $expense): Response
    {
        EditLock::ensureEditable($expense);

        return Inertia::render('expenses/edit', [
            ...$this->formOptions($expense),
            'expense' => $expense,
            'today' => Date::today()->toDateString(),
        ]);
    }

    /**
     * Correct an expense.
     */
    public function update(Request $request, Expense $expense): RedirectResponse
    {
        EditLock::ensureEditable($expense);

        $expense->update($this->validated($request));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Expense updated.')]);

        return to_route('expenses.index', ['month' => $expense->spent_on->format('Y-m')]);
    }

    /**
     * Remove an expense entered by mistake.
     */
    public function destroy(Expense $expense): RedirectResponse
    {
        EditLock::ensureEditable($expense);

        $month = $expense->spent_on->format('Y-m');
        $expense->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Expense deleted.')]);

        return to_route('expenses.index', ['month' => $month]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        $category = ExpenseCategory::find($request->integer('expense_category_id'));
        $forVehicle = $category?->kind === ExpenseKind::Vehicle;

        $validated = $request->validate([
            'spent_on' => ['required', 'date', 'before_or_equal:today'],
            'expense_category_id' => ['required', 'integer', Rule::exists(ExpenseCategory::class, 'id')],
            // Vehicle expenses (fuel, driver, repairs) belong to one factory vehicle.
            'vehicle_id' => [$forVehicle ? 'required' : 'nullable', 'integer', Rule::exists(Vehicle::class, 'id')],
            'amount' => ['required', 'numeric', 'gt:0', 'max:99999999'],
            'method' => ['required', Rule::enum(PaymentMethod::class)],
            'paid_to' => ['nullable', 'string', 'max:255'],
            'reference' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        return [...$validated, 'vehicle_id' => $forVehicle ? $validated['vehicle_id'] : null];
    }

    /**
     * @return array<string, mixed>
     */
    private function formOptions(?Expense $expense = null): array
    {
        return [
            'categories' => ExpenseCategory::ordered()
                ->where(fn ($query) => $query->where('is_active', true)->orWhere('id', $expense?->expense_category_id))
                ->get(['id', 'name', 'kind']),
            'vehicles' => Vehicle::query()
                ->where(fn ($query) => $query->where('is_active', true)->orWhere('id', $expense?->vehicle_id))
                ->orderBy('name')
                ->get(['id', 'name', 'registration_no']),
            'methods' => PaymentMethod::options(),
        ];
    }
}

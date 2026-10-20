import { Head } from '@inertiajs/react';
import ExpenseController from '@/actions/App/Http/Controllers/ExpenseController';
import type { Expense } from '@/components/expenses/expense-form';
import { ExpenseForm } from '@/components/expenses/expense-form';
import Heading from '@/components/heading';
import { useTrans } from '@/hooks/use-trans';
import { index } from '@/routes/expenses';
import type { Option } from '@/types';

type Props = {
    expense: Expense;
    categories: { id: number; name: string; kind: 'factory' | 'vehicle' }[];
    vehicles: { id: number; name: string; registration_no: string | null }[];
    methods: Option[];
    today: string;
};

export default function EditExpense({ expense, ...props }: Props) {
    const { t } = useTrans();

    return (
        <>
            <Head title={t('Correct expense')} />
            <div className="p-4 md:p-6">
                <Heading title={t('Correct expense')} />
                <ExpenseForm
                    form={ExpenseController.update.form(expense.id)}
                    expense={expense}
                    {...props}
                />
            </div>
        </>
    );
}

EditExpense.layout = {
    breadcrumbs: [{ title: 'Expenses', href: index() }],
};

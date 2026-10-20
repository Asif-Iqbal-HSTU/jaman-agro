import { Head } from '@inertiajs/react';
import ExpenseController from '@/actions/App/Http/Controllers/ExpenseController';
import { ExpenseForm } from '@/components/expenses/expense-form';
import Heading from '@/components/heading';
import { useTrans } from '@/hooks/use-trans';
import { create, index } from '@/routes/expenses';
import type { Option } from '@/types';

type Props = {
    categories: { id: number; name: string; kind: 'factory' | 'vehicle' }[];
    vehicles: { id: number; name: string; registration_no: string | null }[];
    methods: Option[];
    today: string;
};

export default function CreateExpense(props: Props) {
    const { t } = useTrans();

    return (
        <>
            <Head title={t('Record expense')} />
            <div className="p-4 md:p-6">
                <Heading
                    title={t('Record expense')}
                    description={t('Money spent on running the factory.')}
                />
                <ExpenseForm form={ExpenseController.store.form()} {...props} />
            </div>
        </>
    );
}

CreateExpense.layout = {
    breadcrumbs: [
        { title: 'Expenses', href: index() },
        { title: 'Record expense', href: create() },
    ],
};

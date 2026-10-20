import { Head, Link, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { Expense } from '@/components/expenses/expense-form';
import { EditedBadge } from '@/components/edited-badge';
import Heading from '@/components/heading';
import { RecordActions } from '@/components/record-actions';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCanManage } from '@/hooks/use-can-manage';
import { useFormat } from '@/hooks/use-format';
import { useTrans } from '@/hooks/use-trans';
import { cn } from '@/lib/utils';
import { create, destroy, edit, index } from '@/routes/expenses';
import type { Paginated } from '@/types';

type Props = {
    month: string;
    expenses: Paginated<Expense>;
    categories: {
        id: number;
        name: string;
        is_active: boolean;
        total: string;
    }[];
    total: string;
    filters: { category: number | null };
};

const shiftMonth = (month: string, by: number) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + by, 1);

    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export default function Expenses({
    month,
    expenses,
    categories,
    total,
    filters,
}: Props) {
    const { t, locale } = useTrans();
    const f = useFormat();
    const canManage = useCanManage();
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthName = new Intl.DateTimeFormat(
        locale === 'bn' ? 'bn-BD' : 'en-GB',
        {
            month: 'long',
            year: 'numeric',
        },
    ).format(new Date(`${month}-01T00:00:00`));
    const methodLabel: Record<string, string> = {
        cash: 'Cash',
        bank: 'Bank',
        mobile_banking: 'Mobile banking',
    };

    const remove = (expense: Expense) => {
        if (window.confirm(t('Delete this expense? This cannot be undone.'))) {
            router.delete(destroy(expense.id), { preserveScroll: true });
        }
    };

    return (
        <>
            <Head title={t('Expenses')} />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading title={t('Expenses')} description={monthName} />
                    {canManage && (
                        <Button asChild>
                            <Link href={create()}>
                                <Plus /> {t('Record expense')}
                            </Link>
                        </Button>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="icon" asChild>
                        <Link
                            href={index({
                                query: { month: shiftMonth(month, -1) },
                            })}
                            aria-label={t('Previous month')}
                        >
                            <ChevronLeft />
                        </Link>
                    </Button>
                    <Input
                        type="month"
                        value={month}
                        max={currentMonth}
                        onChange={(e) =>
                            e.target.value &&
                            router.get(
                                index({ query: { month: e.target.value } }),
                            )
                        }
                        className="w-44"
                        aria-label={t('Month')}
                    />
                    {month < currentMonth && (
                        <Button variant="outline" size="icon" asChild>
                            <Link
                                href={index({
                                    query: { month: shiftMonth(month, 1) },
                                })}
                                aria-label={t('Next month')}
                            >
                                <ChevronRight />
                            </Link>
                        </Button>
                    )}
                </div>

                <div className="rounded-xl border bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">
                        {t('Total this month')}
                    </p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums">
                        {f.money(total)}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {categories
                        .filter((c) => c.is_active || Number(c.total) > 0)
                        .map((c) => (
                            <Link
                                key={c.id}
                                href={index({
                                    query: {
                                        month,
                                        category:
                                            filters.category === c.id
                                                ? undefined
                                                : c.id,
                                    },
                                })}
                                preserveScroll
                                className={cn(
                                    'rounded-lg border px-3 py-2 text-sm transition hover:bg-muted/40',
                                    filters.category === c.id &&
                                        'border-primary ring-1 ring-primary',
                                )}
                            >
                                <span className="block text-xs text-muted-foreground">
                                    {t(c.name)}
                                </span>
                                <span className="font-medium tabular-nums">
                                    {f.money(c.total)}
                                </span>
                            </Link>
                        ))}
                </div>

                <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left text-xs text-muted-foreground uppercase">
                            <tr>
                                <th className="px-4 py-3 font-medium">
                                    {t('Date')}
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    {t('Category')}
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    {t('Paid to')}
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    {t('Paid by')}
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    {t('Amount')}
                                </th>
                                {canManage && <th className="px-4 py-3" />}
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {expenses.data.map((e) => (
                                <tr key={e.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {f.date(e.spent_on)}
                                        <EditedBadge at={e.edited_at} />
                                    </td>
                                    <td className="px-4 py-3">
                                        {e.category ? t(e.category.name) : ''}
                                        {e.vehicle && (
                                            <span className="ml-1 text-xs text-muted-foreground">
                                                · {e.vehicle.name}
                                            </span>
                                        )}
                                        {e.notes && (
                                            <p className="text-xs text-muted-foreground">
                                                {e.notes}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        {e.paid_to ?? '—'}
                                        {e.reference && (
                                            <p className="text-xs text-muted-foreground">
                                                {e.reference}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        {t(methodLabel[e.method] ?? e.method)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                                        {f.money(e.amount)}
                                    </td>
                                    {canManage && (
                                        <td className="px-2 py-2 text-right whitespace-nowrap">
                                            <RecordActions
                                                lock={e.edit_lock}
                                                subject="expense"
                                                id={e.id}
                                                editHref={edit(e.id)}
                                                onDelete={() => remove(e)}
                                            />
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {expenses.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-10 text-center text-muted-foreground"
                                    >
                                        {t('No expenses this month.')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination page={expenses} />
            </div>
        </>
    );
}

Expenses.layout = {
    breadcrumbs: [{ title: 'Expenses', href: index() }],
};

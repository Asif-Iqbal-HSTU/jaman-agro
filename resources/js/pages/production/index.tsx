import { Head, Link, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { EditedBadge } from '@/components/edited-badge';
import Heading from '@/components/heading';
import { RecordActions } from '@/components/record-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCanManage } from '@/hooks/use-can-manage';
import { useFormat } from '@/hooks/use-format';
import { useTrans } from '@/hooks/use-trans';
import { create, destroy, edit, index } from '@/routes/production';
import type { ProductionBatch, TeaGrade } from '@/types';

type Props = {
    month: string;
    batches: (ProductionBatch & { made_tea_kg: string })[];
    grades: TeaGrade[];
    totals: {
        batches: number;
        green_leaf_kg: string;
        made_tea_kg: string;
        recovery: string | null;
        leaf_received_kg: string;
        by_grade: Record<string, string>;
    };
};

const shiftMonth = (month: string, by: number) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + by, 1);

    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export default function Production({ month, batches, grades, totals }: Props) {
    const { t, locale } = useTrans();
    const f = useFormat();
    const canManage = useCanManage();
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthName = new Intl.DateTimeFormat(
        locale === 'bn' ? 'bn-BD' : 'en-GB',
        { month: 'long', year: 'numeric' },
    ).format(new Date(`${month}-01T00:00:00`));

    const remove = (batch: ProductionBatch) => {
        if (
            window.confirm(
                t(
                    'Delete the batch of :date? Its tea will be taken out of stock.',
                    { date: f.date(batch.produced_on) },
                ),
            )
        ) {
            router.delete(destroy(batch.id), { preserveScroll: true });
        }
    };

    return (
        <>
            <Head title={t('Production')} />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading title={t('Production')} description={monthName} />
                    {canManage && (
                        <Button asChild>
                            <Link href={create()}>
                                <Plus /> {t('Record production')}
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

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">
                            {t('Made tea')}
                        </p>
                        <p className="mt-1 text-xl font-semibold tabular-nums">
                            {f.kg(totals.made_tea_kg)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {t(':count batches', {
                                count: f.number(totals.batches),
                            })}
                        </p>
                    </div>
                    <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">
                            {t('Recovery')}
                        </p>
                        <p className="mt-1 text-xl font-semibold tabular-nums">
                            {totals.recovery === null
                                ? '—'
                                : `${f.decimal(totals.recovery)}%`}
                        </p>
                    </div>
                    <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">
                            {t('Green leaf used')}
                        </p>
                        <p className="mt-1 text-xl font-semibold tabular-nums">
                            {f.kg(totals.green_leaf_kg)}
                        </p>
                    </div>
                    <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">
                            {t('Net leaf received')}
                        </p>
                        <p className="mt-1 text-xl font-semibold tabular-nums">
                            {f.kg(totals.leaf_received_kg)}
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left text-xs text-muted-foreground uppercase">
                            <tr>
                                <th className="px-4 py-3 font-medium">
                                    {t('Date')}
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    {t('Green leaf')}
                                </th>
                                {grades.map((g) => (
                                    <th
                                        key={g.id}
                                        className="px-3 py-3 text-right font-medium normal-case"
                                        title={g.name ?? undefined}
                                    >
                                        {g.code}
                                    </th>
                                ))}
                                <th className="px-4 py-3 text-right font-medium">
                                    {t('Made tea')}
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    {t('Recovery')}
                                </th>
                                {canManage && <th className="px-4 py-3" />}
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {batches.map((b) => (
                                <tr key={b.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {f.date(b.produced_on)}
                                        <EditedBadge at={b.edited_at} />
                                        {b.notes && (
                                            <p className="max-w-48 truncate text-xs text-muted-foreground">
                                                {b.notes}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {f.decimal(b.green_leaf_kg)}
                                    </td>
                                    {grades.map((g) => (
                                        <td
                                            key={g.id}
                                            className="px-3 py-3 text-right text-muted-foreground tabular-nums"
                                        >
                                            {b.outputs[g.id]
                                                ? f.decimal(b.outputs[g.id])
                                                : '·'}
                                        </td>
                                    ))}
                                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                                        {f.decimal(b.made_tea_kg)}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {b.recovery
                                            ? `${f.decimal(b.recovery)}%`
                                            : '—'}
                                    </td>
                                    {canManage && (
                                        <td className="px-2 py-2 text-right whitespace-nowrap">
                                            <RecordActions
                                                lock={b.edit_lock}
                                                subject="production_batch"
                                                id={b.id}
                                                editHref={edit(b.id)}
                                                onDelete={() => remove(b)}
                                            />
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {batches.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={grades.length + 5}
                                        className="px-4 py-10 text-center text-muted-foreground"
                                    >
                                        {t(
                                            'No production recorded this month.',
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {batches.length > 0 && (
                            <tfoot className="border-t-2 font-semibold">
                                <tr>
                                    <td className="px-4 py-3">{t('Total')}</td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {f.decimal(totals.green_leaf_kg)}
                                    </td>
                                    {grades.map((g) => (
                                        <td
                                            key={g.id}
                                            className="px-3 py-3 text-right tabular-nums"
                                        >
                                            {totals.by_grade[g.id]
                                                ? f.decimal(
                                                      totals.by_grade[g.id],
                                                  )
                                                : '·'}
                                        </td>
                                    ))}
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {f.decimal(totals.made_tea_kg)}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {totals.recovery
                                            ? `${f.decimal(totals.recovery)}%`
                                            : '—'}
                                    </td>
                                    {canManage && <td />}
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </>
    );
}

Production.layout = {
    breadcrumbs: [{ title: 'Production', href: index() }],
};

import { Head, Link } from '@inertiajs/react';
import { SlidersHorizontal } from 'lucide-react';
import Heading from '@/components/heading';
import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCanManage } from '@/hooks/use-can-manage';
import { useFormat } from '@/hooks/use-format';
import { useTrans } from '@/hooks/use-trans';
import { cn } from '@/lib/utils';
import { adjust, index } from '@/routes/stock';
import type { Paginated, StockMovement } from '@/types';

type GradeStock = {
    id: number;
    code: string;
    name: string | null;
    is_active: boolean;
    produced: string;
    adjusted: string;
    balance: string;
};

const typeLabels: Record<StockMovement['type'], string> = {
    production: 'Production',
    adjustment: 'Adjustment',
    auction: 'Auction',
    retail: 'Retail sale',
};

type Props = {
    grades: GradeStock[];
    total: string;
    movements: Paginated<StockMovement>;
    filters: { grade: number | null };
};

export default function Stock({ grades, total, movements, filters }: Props) {
    const { t } = useTrans();
    const f = useFormat();
    const canManage = useCanManage();

    return (
        <>
            <Head title={t('Made tea stock')} />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title={t('Made tea stock')}
                        description={t(
                            'What is in the warehouse, grade by grade.',
                        )}
                    />
                    {canManage && (
                        <Button variant="outline" asChild>
                            <Link href={adjust()}>
                                <SlidersHorizontal /> {t('Adjust stock')}
                            </Link>
                        </Button>
                    )}
                </div>

                <div className="rounded-xl border bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">
                        {t('Total in stock')}
                    </p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums">
                        {f.kg(total)}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
                    {grades.map((g) => (
                        <Link
                            key={g.id}
                            href={index({
                                query: {
                                    grade:
                                        filters.grade === g.id
                                            ? undefined
                                            : g.id,
                                },
                            })}
                            preserveScroll
                            className={cn(
                                'rounded-xl border p-3 transition hover:bg-muted/40',
                                filters.grade === g.id &&
                                    'border-primary ring-1 ring-primary',
                            )}
                            title={g.name ?? undefined}
                        >
                            <p className="text-sm font-semibold">{g.code}</p>
                            <p className="mt-1 text-lg font-semibold tabular-nums">
                                {f.decimal(g.balance)}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                                kg
                            </p>
                        </Link>
                    ))}
                </div>

                <div>
                    <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                        {filters.grade
                            ? t('Stock movements of :grade', {
                                  grade:
                                      grades.find((g) => g.id === filters.grade)
                                          ?.code ?? '',
                              })
                            : t('All stock movements')}
                    </h2>
                    <div className="overflow-x-auto rounded-xl border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-left text-xs text-muted-foreground uppercase">
                                <tr>
                                    <th className="px-4 py-3 font-medium">
                                        {t('Date')}
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        {t('Grade')}
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        {t('Type')}
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        {t('Details')}
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium">
                                        {t('Quantity')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {movements.data.map((m) => {
                                    const qty = Number(m.quantity_kg);

                                    return (
                                        <tr key={m.id}>
                                            <td className="px-4 py-2 whitespace-nowrap">
                                                {f.date(m.moved_on)}
                                            </td>
                                            <td className="px-4 py-2 font-medium">
                                                {m.grade?.code}
                                            </td>
                                            <td className="px-4 py-2">
                                                <Badge
                                                    variant={
                                                        m.type === 'production'
                                                            ? 'secondary'
                                                            : 'outline'
                                                    }
                                                >
                                                    {t(typeLabels[m.type])}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-2 text-muted-foreground">
                                                {m.reason ?? ''}
                                                {m.recorder && (
                                                    <span className="ml-1 text-xs">
                                                        · {m.recorder.name}
                                                    </span>
                                                )}
                                            </td>
                                            <td
                                                className={cn(
                                                    'px-4 py-2 text-right font-medium tabular-nums',
                                                    qty < 0 &&
                                                        'text-red-700 dark:text-red-400',
                                                )}
                                            >
                                                {qty > 0 ? '+' : '−'}
                                                {f.kg(Math.abs(qty))}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {movements.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-4 py-10 text-center text-muted-foreground"
                                        >
                                            {t('No stock movements yet.')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <Pagination page={movements} />
            </div>
        </>
    );
}

Stock.layout = {
    breadcrumbs: [{ title: 'Made tea stock', href: index() }],
};

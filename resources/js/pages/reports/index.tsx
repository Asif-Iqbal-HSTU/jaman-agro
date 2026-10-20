import { Head, router } from '@inertiajs/react';
import { Printer } from 'lucide-react';
import { BarList } from '@/components/charts/bar-list';
import { ColumnChart } from '@/components/charts/column-chart';
import { LineChart } from '@/components/charts/line-chart';
import Heading from '@/components/heading';
import { NativeSelect } from '@/components/native-select';
import { Button } from '@/components/ui/button';
import { useFormat } from '@/hooks/use-format';
import { useTrans } from '@/hooks/use-trans';
import { cn } from '@/lib/utils';
import { index } from '@/routes/reports';

type Figures = {
    leaf_kg: string;
    leaf_cost: string;
    green_leaf_used_kg: string;
    made_tea_kg: string;
    auction_kg: string;
    auction_revenue: string;
    retail_revenue: string;
    expenses: string;
    transport_cost: string;
    wages: string;
    landed_leaf_cost_per_kg: string | null;
    recovery: string | null;
    revenue: string;
    costs: string;
    result: string;
    cost_per_kg: string | null;
};

type Props = {
    report: {
        year: number;
        months: (Figures & { month: string })[];
        totals: Figures;
        grades: {
            code: string;
            made_kg: string;
            auction_kg: string;
            average_price: string | null;
        }[];
        expenses_by_category: { name: string; total: string }[];
    };
    years: number[];
};

function Tile({
    label,
    value,
    hint,
    tone,
}: {
    label: string;
    value: string;
    hint?: string;
    tone?: 'good' | 'bad';
}) {
    return (
        <div className="rounded-xl border p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p
                className={cn(
                    'mt-1 text-xl font-semibold break-words tabular-nums',
                    tone === 'good' && 'text-emerald-700 dark:text-emerald-400',
                    tone === 'bad' && 'text-red-700 dark:text-red-400',
                )}
            >
                {value}
            </p>
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
    );
}

function Panel({
    title,
    subtitle,
    children,
    className,
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <section
            className={cn(
                'break-inside-avoid rounded-xl border p-4',
                className,
            )}
        >
            <h2 className="font-medium">{title}</h2>
            {subtitle && (
                <p className="mb-4 text-xs text-muted-foreground">{subtitle}</p>
            )}
            {children}
        </section>
    );
}

export default function Reports({ report, years }: Props) {
    const { t } = useTrans();
    const f = useFormat();
    const { months, totals } = report;
    const labels = months.map((m) => f.shortMonth(m.month));
    const n = (v: string | null) => (v === null ? null : Number(v));
    const result = Number(totals.result);

    return (
        <>
            <Head title={t('Reports')} />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title={t('Reports')}
                        description={t(
                            'The factory year month by month: leaf, tea, sales and costs.',
                        )}
                    />
                    <div className="flex items-center gap-2 print:hidden">
                        <NativeSelect
                            value={String(report.year)}
                            onChange={(e) =>
                                router.get(
                                    index({ query: { year: e.target.value } }),
                                )
                            }
                            aria-label={t('Year')}
                            className="w-28"
                        >
                            {years.map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </NativeSelect>
                        <Button variant="ghost" onClick={() => window.print()}>
                            <Printer /> {t('Print')}
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Tile
                        label={t('Sales')}
                        value={f.money(totals.revenue)}
                        hint={t('Auction :a · Retail :r', {
                            a: f.compact(totals.auction_revenue),
                            r: f.compact(totals.retail_revenue),
                        })}
                    />
                    <Tile
                        label={t('Costs')}
                        value={f.money(totals.costs)}
                        hint={t(
                            'Leaf :l · Transport :tr · Wages :w · Expenses :e',
                            {
                                l: f.compact(totals.leaf_cost),
                                tr: f.compact(totals.transport_cost),
                                w: f.compact(totals.wages),
                                e: f.compact(totals.expenses),
                            },
                        )}
                    />
                    <Tile
                        label={t('Sales less costs')}
                        value={f.money(totals.result)}
                        tone={
                            result > 0 ? 'good' : result < 0 ? 'bad' : undefined
                        }
                    />
                    <Tile
                        label={t('Made tea')}
                        value={f.kg(totals.made_tea_kg)}
                    />
                    <Tile
                        label={t('Recovery')}
                        value={
                            totals.recovery === null
                                ? '—'
                                : `${f.decimal(totals.recovery)}%`
                        }
                    />
                    <Tile
                        label={t('Landed leaf cost per kg')}
                        value={
                            totals.landed_leaf_cost_per_kg === null
                                ? '—'
                                : f.money(totals.landed_leaf_cost_per_kg)
                        }
                        hint={t(
                            'Leaf price plus the cost of the factory vehicles that bring it in.',
                        )}
                    />
                    <Tile
                        label={t('Cost per kg made tea')}
                        value={
                            totals.cost_per_kg === null
                                ? '—'
                                : f.money(totals.cost_per_kg)
                        }
                    />
                </div>

                <Panel
                    title={t('Sales and costs by month')}
                    subtitle={t(
                        'Sales are auction net proceeds plus retail. Costs are green leaf bought, transport, wages and other expenses.',
                    )}
                >
                    <ColumnChart
                        categories={labels}
                        series={[
                            {
                                key: 'revenue',
                                name: t('Sales'),
                                color: 'var(--series-1)',
                            },
                            {
                                key: 'costs',
                                name: t('Costs'),
                                color: 'var(--series-2)',
                            },
                        ]}
                        values={months.map((m) => [
                            Number(m.revenue),
                            Number(m.costs),
                        ])}
                        formatValue={(v) => f.money(v)}
                        formatTick={(v) => f.compact(v)}
                        ariaLabel={t('Sales and costs by month')}
                    />
                </Panel>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Panel title={t('Made tea by month')} subtitle={t('kg')}>
                        <ColumnChart
                            categories={labels}
                            series={[
                                {
                                    key: 'made',
                                    name: t('Made tea'),
                                    color: 'var(--series-1)',
                                },
                            ]}
                            values={months.map((m) => [Number(m.made_tea_kg)])}
                            formatValue={(v) => f.kg(v)}
                            formatTick={(v) => f.compact(v)}
                            height={200}
                            ariaLabel={t('Made tea by month')}
                        />
                    </Panel>
                    <Panel
                        title={t('Recovery by month')}
                        subtitle={t('Made tea as % of green leaf used')}
                    >
                        <LineChart
                            categories={labels}
                            values={months.map((m) => n(m.recovery))}
                            color="var(--series-1)"
                            name={t('Recovery')}
                            formatValue={(v) => `${f.decimal(v)}%`}
                            formatTick={(v) => `${f.number(v)}%`}
                            ariaLabel={t('Recovery by month')}
                        />
                    </Panel>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Panel
                        title={t('Made tea by grade')}
                        subtitle={t('kg made this year')}
                    >
                        {report.grades.length === 0 ? (
                            <p className="py-6 text-center text-sm text-muted-foreground">
                                {t('No production this year.')}
                            </p>
                        ) : (
                            <>
                                <BarList
                                    rows={report.grades.map((g) => ({
                                        label: g.code,
                                        value: Number(g.made_kg),
                                    }))}
                                    color="var(--series-1)"
                                    formatValue={(v) => f.kg(v)}
                                    ariaLabel={t('Made tea by grade')}
                                />
                                <table className="mt-4 w-full text-sm">
                                    <thead className="text-left text-xs text-muted-foreground">
                                        <tr>
                                            <th className="py-1 font-medium">
                                                {t('Grade')}
                                            </th>
                                            <th className="py-1 text-right font-medium">
                                                {t('Sold at auction')}
                                            </th>
                                            <th className="py-1 text-right font-medium">
                                                {t('Average price')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {report.grades.map((g) => (
                                            <tr key={g.code}>
                                                <td className="py-1.5 font-medium">
                                                    {g.code}
                                                </td>
                                                <td className="py-1.5 text-right tabular-nums">
                                                    {f.kg(g.auction_kg)}
                                                </td>
                                                <td className="py-1.5 text-right tabular-nums">
                                                    {g.average_price === null
                                                        ? '—'
                                                        : `${f.money(g.average_price)} / kg`}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </>
                        )}
                    </Panel>
                    <Panel
                        title={t('Expenses by category')}
                        subtitle={t('This year')}
                    >
                        {report.expenses_by_category.length === 0 ? (
                            <p className="py-6 text-center text-sm text-muted-foreground">
                                {t('No expenses this year.')}
                            </p>
                        ) : (
                            <BarList
                                rows={report.expenses_by_category.map((c) => ({
                                    label: t(c.name),
                                    value: Number(c.total),
                                }))}
                                color="var(--series-2)"
                                formatValue={(v) => f.money(v)}
                                ariaLabel={t('Expenses by category')}
                            />
                        )}
                    </Panel>
                </div>

                <Panel
                    title={t('Month by month')}
                    subtitle={t('Every figure behind the charts.')}
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm whitespace-nowrap">
                            <thead className="text-left text-xs text-muted-foreground uppercase">
                                <tr>
                                    <th className="px-2 py-2 font-medium">
                                        {t('Month')}
                                    </th>
                                    <th className="px-2 py-2 text-right font-medium">
                                        {t('Leaf bought')}
                                    </th>
                                    <th className="px-2 py-2 text-right font-medium">
                                        {t('Leaf cost')}
                                    </th>
                                    <th className="px-2 py-2 text-right font-medium">
                                        {t('Made tea')}
                                    </th>
                                    <th className="px-2 py-2 text-right font-medium">
                                        {t('Recovery')}
                                    </th>
                                    <th className="px-2 py-2 text-right font-medium">
                                        {t('Sales')}
                                    </th>
                                    <th className="px-2 py-2 text-right font-medium">
                                        {t('Transport')}
                                    </th>
                                    <th className="px-2 py-2 text-right font-medium">
                                        {t('Wages')}
                                    </th>
                                    <th className="px-2 py-2 text-right font-medium">
                                        {t('Expenses')}
                                    </th>
                                    <th className="px-2 py-2 text-right font-medium">
                                        {t('Sales less costs')}
                                    </th>
                                    <th className="px-2 py-2 text-right font-medium">
                                        {t('Cost per kg')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {[
                                    ...months.map((m) => ({
                                        ...m,
                                        label: f.shortMonth(m.month),
                                    })),
                                    { ...totals, label: t('Total') },
                                ].map((row, i) => (
                                    <tr
                                        key={row.label}
                                        className={cn(
                                            i === months.length &&
                                                'border-t-2 font-semibold',
                                        )}
                                    >
                                        <td className="px-2 py-1.5">
                                            {row.label}
                                        </td>
                                        <td className="px-2 py-1.5 text-right tabular-nums">
                                            {f.decimal(row.leaf_kg)}
                                        </td>
                                        <td className="px-2 py-1.5 text-right tabular-nums">
                                            {f.money(row.leaf_cost)}
                                        </td>
                                        <td className="px-2 py-1.5 text-right tabular-nums">
                                            {f.decimal(row.made_tea_kg)}
                                        </td>
                                        <td className="px-2 py-1.5 text-right tabular-nums">
                                            {row.recovery === null
                                                ? '—'
                                                : `${f.decimal(row.recovery)}%`}
                                        </td>
                                        <td className="px-2 py-1.5 text-right tabular-nums">
                                            {f.money(row.revenue)}
                                        </td>
                                        <td className="px-2 py-1.5 text-right tabular-nums">
                                            {f.money(row.transport_cost)}
                                        </td>
                                        <td className="px-2 py-1.5 text-right tabular-nums">
                                            {f.money(row.wages)}
                                        </td>
                                        <td className="px-2 py-1.5 text-right tabular-nums">
                                            {f.money(row.expenses)}
                                        </td>
                                        <td
                                            className={cn(
                                                'px-2 py-1.5 text-right tabular-nums',
                                                Number(row.result) < 0 &&
                                                    'text-red-700 dark:text-red-400',
                                            )}
                                        >
                                            {f.money(row.result)}
                                        </td>
                                        <td className="px-2 py-1.5 text-right tabular-nums">
                                            {row.cost_per_kg === null
                                                ? '—'
                                                : f.money(row.cost_per_kg)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                        {t(
                            '“Sales less costs” is a simple cash view: it does not count the value of tea still in stock, so a month that makes tea but sells little will look weak.',
                        )}
                    </p>
                </Panel>
            </div>
        </>
    );
}

Reports.layout = {
    breadcrumbs: [{ title: 'Reports', href: index() }],
};

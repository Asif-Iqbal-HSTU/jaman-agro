import { Form, Head } from '@inertiajs/react';
import { Printer } from 'lucide-react';
import Heading from '@/components/heading';
import { NativeSelect } from '@/components/native-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFormat } from '@/hooks/use-format';
import { useTrans } from '@/hooks/use-trans';
import { cn } from '@/lib/utils';
import { index } from '@/routes/cash-book';
import type { Option } from '@/types';

type Entry = {
    date: string;
    kind: 'customer' | 'auction' | 'supplier' | 'expense' | 'wages';
    details: string;
    method: string;
    in: string | null;
    out: string | null;
};

type Totals = { in: string; out: string; net: string };

type Props = {
    book: {
        entries: Entry[];
        totals: Totals;
        by_method: (Totals & { method: string; label: string })[];
    };
    filters: { from: string; to: string; method: string | null };
    methods: Option[];
};

const kindLabels: Record<Entry['kind'], string> = {
    customer: 'From customer',
    auction: 'Auction proceeds',
    supplier: 'To leaf supplier',
    expense: 'Expense',
    wages: 'Wages paid',
};

export default function CashBook({ book, filters, methods }: Props) {
    const { t } = useTrans();
    const f = useFormat();
    const methodLabel = (value: string) =>
        methods.find((m) => m.value === value)?.label ?? value;
    const net = Number(book.totals.net);

    return (
        <>
            <Head title={t('Cash book')} />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title={t('Cash book')}
                        description={t(
                            'Every taka that came in or went out, by payment method.',
                        )}
                    />
                    <Button
                        variant="ghost"
                        onClick={() => window.print()}
                        className="print:hidden"
                    >
                        <Printer /> {t('Print')}
                    </Button>
                </div>

                <Form
                    {...index.form()}
                    options={{ preserveState: true }}
                    className="flex flex-wrap items-end gap-3 print:hidden"
                >
                    <div className="grid gap-1">
                        <Label htmlFor="from">{t('From')}</Label>
                        <Input
                            id="from"
                            name="from"
                            type="date"
                            defaultValue={filters.from}
                        />
                    </div>
                    <div className="grid gap-1">
                        <Label htmlFor="to">{t('To')}</Label>
                        <Input
                            id="to"
                            name="to"
                            type="date"
                            defaultValue={filters.to}
                        />
                    </div>
                    <div className="grid gap-1">
                        <Label htmlFor="method">{t('Paid by')}</Label>
                        <NativeSelect
                            id="method"
                            name="method"
                            defaultValue={filters.method ?? ''}
                            className="w-44"
                        >
                            <option value="">{t('All')}</option>
                            {methods.map((m) => (
                                <option key={m.value} value={m.value}>
                                    {m.label}
                                </option>
                            ))}
                        </NativeSelect>
                    </div>
                    <Button type="submit" variant="outline">
                        {t('Show')}
                    </Button>
                </Form>

                <p className="text-sm font-medium">
                    {t('From :from to :to', {
                        from: f.date(filters.from),
                        to: f.date(filters.to),
                    })}
                </p>

                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">
                            {t('Money in')}
                        </p>
                        <p className="mt-1 text-xl font-semibold tabular-nums">
                            {f.money(book.totals.in)}
                        </p>
                    </div>
                    <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">
                            {t('Money out')}
                        </p>
                        <p className="mt-1 text-xl font-semibold tabular-nums">
                            {f.money(book.totals.out)}
                        </p>
                    </div>
                    <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">
                            {t('Net')}
                        </p>
                        <p
                            className={cn(
                                'mt-1 text-xl font-semibold tabular-nums',
                                net < 0 && 'text-red-700 dark:text-red-400',
                            )}
                        >
                            {net < 0 ? '− ' : ''}
                            {f.money(Math.abs(net))}
                        </p>
                    </div>
                </div>

                {!filters.method && (
                    <div className="overflow-x-auto rounded-xl border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-left text-xs text-muted-foreground uppercase">
                                <tr>
                                    <th className="px-4 py-2 font-medium">
                                        {t('Paid by')}
                                    </th>
                                    <th className="px-4 py-2 text-right font-medium">
                                        {t('Money in')}
                                    </th>
                                    <th className="px-4 py-2 text-right font-medium">
                                        {t('Money out')}
                                    </th>
                                    <th className="px-4 py-2 text-right font-medium">
                                        {t('Net')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {book.by_method.map((m) => (
                                    <tr key={m.method}>
                                        <td className="px-4 py-2 font-medium">
                                            {m.label}
                                        </td>
                                        <td className="px-4 py-2 text-right tabular-nums">
                                            {f.money(m.in)}
                                        </td>
                                        <td className="px-4 py-2 text-right tabular-nums">
                                            {f.money(m.out)}
                                        </td>
                                        <td
                                            className={cn(
                                                'px-4 py-2 text-right font-medium tabular-nums',
                                                Number(m.net) < 0 &&
                                                    'text-red-700 dark:text-red-400',
                                            )}
                                        >
                                            {Number(m.net) < 0 ? '− ' : ''}
                                            {f.money(Math.abs(Number(m.net)))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left text-xs text-muted-foreground uppercase">
                            <tr>
                                <th className="px-4 py-3 font-medium">
                                    {t('Date')}
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    {t('Type')}
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    {t('Details')}
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    {t('Paid by')}
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    {t('Money in')}
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    {t('Money out')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {book.entries.map((e, i) => (
                                <tr key={i}>
                                    <td className="px-4 py-2 whitespace-nowrap">
                                        {f.date(e.date)}
                                    </td>
                                    <td className="px-4 py-2">
                                        {t(kindLabels[e.kind])}
                                    </td>
                                    <td className="px-4 py-2 text-muted-foreground">
                                        {t(e.details)}
                                    </td>
                                    <td className="px-4 py-2">
                                        {methodLabel(e.method)}
                                    </td>
                                    <td className="px-4 py-2 text-right tabular-nums">
                                        {e.in ? f.money(e.in) : ''}
                                    </td>
                                    <td className="px-4 py-2 text-right tabular-nums">
                                        {e.out ? f.money(e.out) : ''}
                                    </td>
                                </tr>
                            ))}
                            {book.entries.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-10 text-center text-muted-foreground"
                                    >
                                        {t(
                                            'No money in or out in this period.',
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

CashBook.layout = {
    breadcrumbs: [{ title: 'Cash book', href: index() }],
};

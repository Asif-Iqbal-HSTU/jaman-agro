import { Form, Head, Link, useForm } from '@inertiajs/react';
import { Gift, Wallet } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { NativeSelect } from '@/components/native-select';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useCanManage } from '@/hooks/use-can-manage';
import { useFormat } from '@/hooks/use-format';
import { useTrans } from '@/hooks/use-trans';
import { cn } from '@/lib/utils';
import { bonus, index, pay } from '@/routes/wages';
import type { Option } from '@/types';

type Row = {
    id: number;
    name: string;
    pay_type: 'hourly' | 'contract';
    hourly_rate: string | null;
    hours: string;
    hourly_amount: string;
    piece_amount: string;
    bonus_amount: string;
    earned: string;
    paid_in_period: string;
    owed: string;
};

type Period = { from: string; to: string };

type Props = {
    rows: Row[];
    totals: { earned: string; owed: string; paid_in_period: string };
    filters: Period;
    periods: { sunday: Period; thursday: Period };
    payments: {
        id: number;
        paid_on: string;
        amount: string;
        method: string;
        period_from: string;
        period_to: string;
        worker?: { name: string };
    }[];
    bonuses: {
        id: number;
        given_on: string;
        amount: string;
        reason: string;
        worker?: { name: string };
    }[];
    methods: Option[];
    today: string;
};

function PayDialog({
    row,
    filters,
    methods,
    today,
    onClose,
}: {
    row: Row;
    filters: Period;
    methods: Option[];
    today: string;
    onClose: () => void;
}) {
    const { t } = useTrans();
    const f = useFormat();
    const form = useForm({
        worker_id: row.id,
        paid_on: today,
        period_from: filters.from,
        period_to: filters.to,
        amount: Number(row.owed) > 0 ? row.owed : '',
        method: 'cash',
        reference: '',
    });

    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.submit(pay(), {
                            preserveScroll: true,
                            onSuccess: onClose,
                        });
                    }}
                    className="space-y-4"
                >
                    <DialogHeader>
                        <DialogTitle>
                            {t('Pay :name', { name: row.name })}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'Earned in this period :earned. Owed in total :owed.',
                                {
                                    earned: f.money(row.earned),
                                    owed: f.money(row.owed),
                                },
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-1">
                            <Label htmlFor="amount">{t('Amount (৳)')}</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0"
                                value={form.data.amount}
                                onChange={(e) =>
                                    form.setData('amount', e.target.value)
                                }
                                required
                                autoFocus
                            />
                            <InputError message={form.errors.amount} />
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="paid_on">{t('Date')}</Label>
                            <Input
                                id="paid_on"
                                type="date"
                                max={today}
                                value={form.data.paid_on}
                                onChange={(e) =>
                                    form.setData('paid_on', e.target.value)
                                }
                                required
                            />
                            <InputError message={form.errors.paid_on} />
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="method">{t('Paid by')}</Label>
                            <NativeSelect
                                id="method"
                                value={form.data.method}
                                onChange={(e) =>
                                    form.setData('method', e.target.value)
                                }
                            >
                                {methods.map((m) => (
                                    <option key={m.value} value={m.value}>
                                        {m.label}
                                    </option>
                                ))}
                            </NativeSelect>
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="reference">{t('Reference')}</Label>
                            <Input
                                id="reference"
                                value={form.data.reference}
                                onChange={(e) =>
                                    form.setData('reference', e.target.value)
                                }
                                placeholder={t('Optional')}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={onClose}>
                            {t('Cancel')}
                        </Button>
                        <Button disabled={form.processing}>
                            {form.processing && <Spinner />}
                            {t('Record payment')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function BonusDialog({
    row,
    today,
    onClose,
}: {
    row: Row;
    today: string;
    onClose: () => void;
}) {
    const { t } = useTrans();
    const form = useForm({
        worker_id: row.id,
        given_on: today,
        amount: '',
        reason: '',
    });

    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.submit(bonus(), {
                            preserveScroll: true,
                            onSuccess: onClose,
                        });
                    }}
                    className="space-y-4"
                >
                    <DialogHeader>
                        <DialogTitle>
                            {t('Bonus for :name', { name: row.name })}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'A bonus is added to what the worker has earned and is paid with the wages.',
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-1">
                            <Label htmlFor="bonus_amount">
                                {t('Amount (৳)')}
                            </Label>
                            <Input
                                id="bonus_amount"
                                type="number"
                                step="0.01"
                                min="0"
                                value={form.data.amount}
                                onChange={(e) =>
                                    form.setData('amount', e.target.value)
                                }
                                required
                                autoFocus
                            />
                            <InputError message={form.errors.amount} />
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="given_on">{t('Date')}</Label>
                            <Input
                                id="given_on"
                                type="date"
                                max={today}
                                value={form.data.given_on}
                                onChange={(e) =>
                                    form.setData('given_on', e.target.value)
                                }
                                required
                            />
                        </div>
                    </div>
                    <div className="grid gap-1">
                        <Label htmlFor="reason">{t('Reason')}</Label>
                        <Input
                            id="reason"
                            value={form.data.reason}
                            onChange={(e) =>
                                form.setData('reason', e.target.value)
                            }
                            placeholder={t('e.g. Eid bonus, extra night work')}
                            required
                        />
                        <InputError message={form.errors.reason} />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={onClose}>
                            {t('Cancel')}
                        </Button>
                        <Button disabled={form.processing}>
                            {t('Add bonus')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function Wages({
    rows,
    totals,
    filters,
    periods,
    payments,
    bonuses,
    methods,
    today,
}: Props) {
    const { t } = useTrans();
    const f = useFormat();
    const canManage = useCanManage();
    const [paying, setPaying] = useState<Row | null>(null);
    const [giving, setGiving] = useState<Row | null>(null);
    const methodLabel = (v: string) =>
        methods.find((m) => m.value === v)?.label ?? v;

    const presets = [
        {
            key: 'sunday',
            label: t('Sunday pay (Thu–Sat)'),
            period: periods.sunday,
        },
        {
            key: 'thursday',
            label: t('Thursday pay (Sun–Wed)'),
            period: periods.thursday,
        },
    ];

    return (
        <>
            <Head title={t('Wages')} />
            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title={t('Wages')}
                    description={t(
                        'What each worker earned in the period, from attendance, contract work and bonuses, and what is still owed.',
                    )}
                />

                <div className="flex flex-wrap items-end gap-3">
                    {presets.map((p) => {
                        const active =
                            p.period.from === filters.from &&
                            p.period.to === filters.to;

                        return (
                            <Button
                                key={p.key}
                                variant={active ? 'default' : 'outline'}
                                asChild
                            >
                                <Link
                                    href={index({ query: p.period })}
                                    preserveScroll
                                >
                                    {p.label}
                                    <span
                                        className={cn(
                                            'text-xs',
                                            active
                                                ? 'opacity-80'
                                                : 'text-muted-foreground',
                                        )}
                                    >
                                        {f.date(p.period.from)} –{' '}
                                        {f.date(p.period.to)}
                                    </span>
                                </Link>
                            </Button>
                        );
                    })}
                    <Form
                        {...index.form()}
                        className="flex flex-wrap items-end gap-2"
                    >
                        <div className="grid gap-1">
                            <Label htmlFor="from">{t('From')}</Label>
                            <Input
                                id="from"
                                name="from"
                                type="date"
                                defaultValue={filters.from}
                                className="w-40"
                            />
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="to">{t('To')}</Label>
                            <Input
                                id="to"
                                name="to"
                                type="date"
                                defaultValue={filters.to}
                                className="w-40"
                            />
                        </div>
                        <Button type="submit" variant="outline">
                            {t('Show')}
                        </Button>
                    </Form>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">
                            {t('Earned in the period')}
                        </p>
                        <p className="mt-1 text-xl font-semibold tabular-nums">
                            {f.money(totals.earned)}
                        </p>
                    </div>
                    <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">
                            {t('Paid for the period')}
                        </p>
                        <p className="mt-1 text-xl font-semibold tabular-nums">
                            {f.money(totals.paid_in_period)}
                        </p>
                    </div>
                    <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">
                            {t('Still owed (all time)')}
                        </p>
                        <p className="mt-1 text-xl font-semibold tabular-nums">
                            {f.money(totals.owed)}
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left text-xs text-muted-foreground uppercase">
                            <tr>
                                <th className="px-4 py-3 font-medium">
                                    {t('Worker')}
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    {t('Hours')}
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    {t('Hourly pay')}
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    {t('Contract work')}
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    {t('Bonus')}
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    {t('Earned')}
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    {t('Paid')}
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    {t('Owed')}
                                </th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {rows.map((r) => (
                                <tr key={r.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3 font-medium">
                                        {r.name}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {Number(r.hours)
                                            ? f.decimal(r.hours)
                                            : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {f.money(r.hourly_amount)}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {f.money(r.piece_amount)}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {f.money(r.bonus_amount)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                                        {f.money(r.earned)}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {f.money(r.paid_in_period)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                                        {f.money(r.owed)}
                                    </td>
                                    <td className="px-2 py-2 text-right whitespace-nowrap">
                                        {canManage && (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setGiving(r)}
                                                    aria-label={t('Add bonus')}
                                                >
                                                    <Gift />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setPaying(r)}
                                                >
                                                    <Wallet /> {t('Pay')}
                                                </Button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {rows.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={9}
                                        className="px-4 py-10 text-center text-muted-foreground"
                                    >
                                        {t('No work recorded in this period.')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <section>
                        <h2 className="mb-2 text-sm font-medium">
                            {t('Payments since :date', {
                                date: f.date(filters.from),
                            })}
                        </h2>
                        <ul className="divide-y rounded-xl border text-sm">
                            {payments.map((p) => (
                                <li
                                    key={p.id}
                                    className="flex items-center justify-between gap-3 px-4 py-2"
                                >
                                    <span>
                                        {p.worker?.name}
                                        <span className="ml-2 text-xs text-muted-foreground">
                                            {f.date(p.paid_on)} ·{' '}
                                            {methodLabel(p.method)}
                                        </span>
                                    </span>
                                    <span className="tabular-nums">
                                        {f.money(p.amount)}
                                    </span>
                                </li>
                            ))}
                            {payments.length === 0 && (
                                <li className="px-4 py-6 text-center text-muted-foreground">
                                    {t('No payments yet.')}
                                </li>
                            )}
                        </ul>
                    </section>
                    <section>
                        <h2 className="mb-2 text-sm font-medium">
                            {t('Bonuses in this period')}
                        </h2>
                        <ul className="divide-y rounded-xl border text-sm">
                            {bonuses.map((b) => (
                                <li
                                    key={b.id}
                                    className="flex items-center justify-between gap-3 px-4 py-2"
                                >
                                    <span>
                                        {b.worker?.name}
                                        <span className="ml-2 text-xs text-muted-foreground">
                                            {f.date(b.given_on)} · {b.reason}
                                        </span>
                                    </span>
                                    <span className="tabular-nums">
                                        {f.money(b.amount)}
                                    </span>
                                </li>
                            ))}
                            {bonuses.length === 0 && (
                                <li className="px-4 py-6 text-center text-muted-foreground">
                                    {t('No bonuses.')}
                                </li>
                            )}
                        </ul>
                    </section>
                </div>
            </div>

            {paying && (
                <PayDialog
                    row={paying}
                    filters={filters}
                    methods={methods}
                    today={today}
                    onClose={() => setPaying(null)}
                />
            )}
            {giving && (
                <BonusDialog
                    row={giving}
                    today={today}
                    onClose={() => setGiving(null)}
                />
            )}
        </>
    );
}

Wages.layout = {
    breadcrumbs: [{ title: 'Wages', href: index() }],
};

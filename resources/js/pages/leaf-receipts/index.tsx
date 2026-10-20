import { Form, Head, Link, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Plus, Printer, Truck } from 'lucide-react';
import { useState } from 'react';
import LeafRateController from '@/actions/App/Http/Controllers/LeafRateController';
import { EditedBadge } from '@/components/edited-badge';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { RecordActions, UnlockButton } from '@/components/record-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCanManage } from '@/hooks/use-can-manage';
import { useFormat } from '@/hooks/use-format';
import { useTrans } from '@/hooks/use-trans';
import { create, destroy, edit, index, show } from '@/routes/leaf-receipts';
import type { EditLockState, LeafReceipt } from '@/types';

type Props = {
    date: string;
    today: string;
    rate: string | null;
    siteRate: string | null;
    rateLock: EditLockState | null;
    rateId: number | null;
    receipts: LeafReceipt[];
    totals: {
        count: number;
        gross_kg: string;
        deduction_kg: string;
        net_kg: string;
        amount: string;
        suppliers: number;
        factory_vehicle_kg: string;
    };
};

const shiftDate = (date: string, days: number) => {
    const d = new Date(`${date}T00:00:00`);
    d.setDate(d.getDate() + days);

    return [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, '0'),
        String(d.getDate()).padStart(2, '0'),
    ].join('-');
};

function RatePanel({
    date,
    rate,
    siteRate,
    lock,
    rateId,
}: {
    date: string;
    rate: string | null;
    siteRate: string | null;
    lock: EditLockState | null;
    rateId: number | null;
}) {
    const { t } = useTrans();
    const f = useFormat();
    const canManage = useCanManage();
    const [editing, setEditing] = useState(rate === null);
    const locked = lock === 'locked' || lock === 'pending';

    return (
        <div className="rounded-xl border p-4 sm:col-span-2">
            <p className="text-xs text-muted-foreground">
                {t('Leaf rates for this day')}
            </p>
            {canManage && editing && !locked ? (
                <Form
                    {...LeafRateController.store.form()}
                    options={{ preserveScroll: true }}
                    onSuccess={() => setEditing(false)}
                    className="mt-2 flex flex-wrap items-end gap-3"
                >
                    {({ processing, errors }) => (
                        <>
                            <input
                                type="hidden"
                                name="rate_date"
                                value={date}
                            />
                            <div className="grid gap-1">
                                <Label htmlFor="rate" className="text-xs">
                                    {t('Brought by the supplier')}
                                </Label>
                                <Input
                                    id="rate"
                                    name="rate"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    defaultValue={rate ?? ''}
                                    placeholder={t('৳ per kg')}
                                    className="w-32"
                                    required
                                />
                                <InputError message={errors.rate} />
                            </div>
                            <div className="grid gap-1">
                                <Label htmlFor="site_rate" className="text-xs">
                                    {t('Site rate (factory vehicle)')}
                                </Label>
                                <Input
                                    id="site_rate"
                                    name="site_rate"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    defaultValue={siteRate ?? ''}
                                    placeholder={t('৳ per kg')}
                                    className="w-32"
                                />
                                <InputError message={errors.site_rate} />
                            </div>
                            <Button disabled={processing}>
                                {t('Set rate')}
                            </Button>
                            {rate !== null && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setEditing(false)}
                                >
                                    {t('Cancel')}
                                </Button>
                            )}
                        </>
                    )}
                </Form>
            ) : (
                <div className="mt-1 flex flex-wrap items-baseline gap-x-6 gap-y-1">
                    <p>
                        <span className="text-xl font-semibold tabular-nums">
                            {rate === null
                                ? t('Not set yet')
                                : `${f.money(rate)} / kg`}
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground">
                            {t('Brought by the supplier')}
                        </span>
                    </p>
                    <p>
                        <span className="text-xl font-semibold tabular-nums">
                            {siteRate === null
                                ? '—'
                                : `${f.money(siteRate)} / kg`}
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground">
                            {t('Site rate (factory vehicle)')}
                        </span>
                    </p>
                    {canManage &&
                        (locked && rateId ? (
                            <UnlockButton subject="leaf_rate" id={rateId} />
                        ) : (
                            <button
                                type="button"
                                onClick={() => setEditing(true)}
                                className="text-sm text-primary underline-offset-4 hover:underline"
                            >
                                {t('Change')}
                            </button>
                        ))}
                </div>
            )}
            {canManage && editing && rate !== null && (
                <p className="mt-2 text-xs text-muted-foreground">
                    {t(
                        'Changing the rate re-prices every delivery on this day.',
                    )}
                </p>
            )}
        </div>
    );
}

export default function LeafIntake({
    date,
    today,
    rate,
    siteRate,
    rateLock,
    rateId,
    receipts,
    totals,
}: Props) {
    const { t } = useTrans();
    const f = useFormat();
    const canManage = useCanManage();

    const remove = (receipt: LeafReceipt) => {
        if (
            window.confirm(
                t('Delete delivery :number? This cannot be undone.', {
                    number: receipt.number,
                }),
            )
        ) {
            router.delete(destroy(receipt.id), { preserveScroll: true });
        }
    };

    return (
        <>
            <Head title={t('Leaf intake')} />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title={t('Leaf intake')}
                        description={f.longDate(date)}
                    />
                    {canManage && (
                        <Button asChild>
                            <Link href={create({ query: { date } })}>
                                <Plus /> {t('Record delivery')}
                            </Link>
                        </Button>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="icon" asChild>
                        <Link
                            href={index({
                                query: { date: shiftDate(date, -1) },
                            })}
                            aria-label={t('Previous day')}
                        >
                            <ChevronLeft />
                        </Link>
                    </Button>
                    <Input
                        type="date"
                        value={date}
                        max={today}
                        onChange={(e) =>
                            e.target.value &&
                            router.get(
                                index({ query: { date: e.target.value } }),
                            )
                        }
                        className="w-44"
                        aria-label={t('Date')}
                    />
                    <Button
                        variant="outline"
                        size="icon"
                        disabled={date >= today}
                        asChild={date < today}
                    >
                        {date < today ? (
                            <Link
                                href={index({
                                    query: { date: shiftDate(date, 1) },
                                })}
                                aria-label={t('Next day')}
                            >
                                <ChevronRight />
                            </Link>
                        ) : (
                            <ChevronRight />
                        )}
                    </Button>
                    {date !== today && (
                        <Button variant="ghost" asChild>
                            <Link href={index()}>{t('Today')}</Link>
                        </Button>
                    )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <RatePanel
                        key={`${date}-${rate}-${siteRate}`}
                        date={date}
                        rate={rate}
                        siteRate={siteRate}
                        lock={rateLock}
                        rateId={rateId}
                    />
                    <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">
                            {t('Net leaf')}
                        </p>
                        <p className="mt-1 text-xl font-semibold tabular-nums">
                            {f.kg(totals.net_kg)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {t('By factory vehicle: :kg', {
                                kg: f.kg(totals.factory_vehicle_kg),
                            })}
                        </p>
                    </div>
                    <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">
                            {t('Leaf value')}
                        </p>
                        <p className="mt-1 text-xl font-semibold tabular-nums">
                            {f.money(totals.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {t('Gross :gross, deducted :deducted', {
                                gross: f.kg(totals.gross_kg),
                                deducted: f.kg(totals.deduction_kg),
                            })}
                        </p>
                    </div>
                    <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">
                            {t('Deliveries')}
                        </p>
                        <p className="mt-1 text-xl font-semibold tabular-nums">
                            {f.number(totals.count)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {t(':count suppliers', {
                                count: f.number(totals.suppliers),
                            })}
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left text-xs text-muted-foreground uppercase">
                            <tr>
                                <th className="px-4 py-3 font-medium">
                                    {t('Slip')}
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    {t('Supplier')}
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    {t('Gross')}
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    {t('Bags')}
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    {t('Deduction')}
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    {t('Net')}
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    {t('Amount')}
                                </th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {receipts.map((r) => (
                                <tr key={r.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <Link
                                            href={show(r.id)}
                                            className="font-mono text-xs hover:underline"
                                        >
                                            {r.number}
                                        </Link>
                                        <EditedBadge at={r.edited_at} />
                                    </td>
                                    <td className="px-4 py-3">
                                        {r.supplier?.name}
                                        <p className="text-xs text-muted-foreground">
                                            {r.delivery_mode ===
                                            'factory_vehicle' ? (
                                                <span className="inline-flex items-center gap-1">
                                                    <Truck className="size-3" />{' '}
                                                    {r.vehicle?.name ??
                                                        t('Factory vehicle')}
                                                </span>
                                            ) : (
                                                r.vehicle_no
                                            )}
                                        </p>
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {f.decimal(r.gross_kg)}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {f.decimal(r.tare_kg)}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {f.decimal(r.deduction_kg)}
                                        {r.deduction_type === 'percent' && (
                                            <span className="ml-1 text-xs text-muted-foreground">
                                                (
                                                {f.decimal(r.deduction_percent)}
                                                %)
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                                        {f.decimal(r.net_kg)}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {r.amount === null ? (
                                            <span className="text-xs text-amber-700 dark:text-amber-400">
                                                {t('Rate pending')}
                                            </span>
                                        ) : (
                                            f.money(r.amount)
                                        )}
                                    </td>
                                    <td className="px-2 py-2 text-right whitespace-nowrap">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            asChild
                                        >
                                            <Link
                                                href={show(r.id)}
                                                aria-label={t('Print')}
                                            >
                                                <Printer />
                                            </Link>
                                        </Button>
                                        {canManage && (
                                            <RecordActions
                                                lock={r.edit_lock}
                                                subject="leaf_receipt"
                                                id={r.id}
                                                editHref={edit(r.id)}
                                                onDelete={() => remove(r)}
                                            />
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {receipts.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="px-4 py-10 text-center text-muted-foreground"
                                    >
                                        {t('No leaf received on this day.')}
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

LeafIntake.layout = {
    breadcrumbs: [{ title: 'Leaf intake', href: index() }],
};

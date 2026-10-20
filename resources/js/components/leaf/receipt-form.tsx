import { Link, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import { NativeSelect } from '@/components/native-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useFormat } from '@/hooks/use-format';
import { useTrans } from '@/hooks/use-trans';
import { cn } from '@/lib/utils';
import { index, store, update } from '@/routes/leaf-receipts';
import type { LeafReceipt, Option, SupplierSummary } from '@/types';

type DayRates = Record<string, { rate: string; site_rate: string | null }>;

type Props = {
    suppliers: SupplierSummary[];
    vehicles: { id: number; name: string; registration_no: string | null }[];
    rates: DayRates;
    deliveryModes: Option[];
    deductionTypes: Option[];
    receipt?: LeafReceipt;
    date?: string;
    supplierId?: number | null;
};

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Two or three buttons that act like a radio group. */
function Choice({
    value,
    options,
    onChange,
    label,
    compact = false,
}: {
    value: string;
    options: Option[];
    onChange: (v: string) => void;
    label: string;
    compact?: boolean;
}) {
    return (
        <div
            role="radiogroup"
            aria-label={label}
            className={cn(
                'inline-flex gap-1 rounded-lg border p-1',
                compact ? 'shrink-0' : 'flex-wrap',
            )}
        >
            {options.map((o) => (
                <button
                    key={o.value}
                    type="button"
                    role="radio"
                    aria-checked={value === o.value}
                    onClick={() => onChange(o.value)}
                    className={cn(
                        'rounded-md text-sm transition',
                        compact ? 'px-2.5' : 'px-3 py-1.5',
                        value === o.value
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted',
                    )}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );
}

export function ReceiptForm({
    suppliers,
    vehicles,
    rates,
    deliveryModes,
    deductionTypes,
    receipt,
    date,
    supplierId,
}: Props) {
    const { t } = useTrans();
    const f = useFormat();
    const [search, setSearch] = useState('');

    const form = useForm({
        received_on: receipt?.received_on ?? date ?? '',
        supplier_id: String(receipt?.supplier_id ?? supplierId ?? ''),
        delivery_mode: receipt?.delivery_mode ?? 'supplier',
        vehicle_id: String(receipt?.vehicle_id ?? ''),
        vehicle_no: receipt?.vehicle_no ?? '',
        gross_kg: receipt?.gross_kg ?? '',
        tare_kg: receipt?.tare_kg ?? '0',
        // The manager prefers deducting fixed kg; a percentage is still possible.
        deduction_type: receipt?.deduction_type ?? 'kg',
        deduction_value:
            receipt === undefined
                ? ''
                : receipt.deduction_type === 'percent'
                  ? (receipt.deduction_percent ?? '')
                  : receipt.deduction_kg,
        notes: receipt?.notes ?? '',
        add_another: false,
    });
    const { data, setData, errors, processing } = form;
    const byFactory = data.delivery_mode === 'factory_vehicle';

    // The same arithmetic the server does, for a live preview while typing.
    const preview = useMemo(() => {
        const leaf = Math.max(
            0,
            Number(data.gross_kg || 0) - Number(data.tare_kg || 0),
        );
        const value = Number(data.deduction_value || 0);
        const deduction =
            data.deduction_type === 'percent'
                ? round2((leaf * value) / 100)
                : round2(value);
        const net = round2(leaf - deduction);
        const day = rates[data.received_on];
        const rate = byFactory ? day?.site_rate : day?.rate;

        return {
            deduction,
            net,
            rate,
            amount: rate ? round2(net * Number(rate)) : null,
        };
    }, [data, rates, byFactory]);

    const visibleSuppliers = useMemo(() => {
        const q = search.trim().toLowerCase();

        if (q === '') {
            return suppliers;
        }

        return suppliers.filter(
            (s) =>
                String(s.id) === data.supplier_id ||
                s.name.toLowerCase().includes(q) ||
                (s.code ?? '').toLowerCase().includes(q) ||
                (s.garden_name ?? '').toLowerCase().includes(q),
        );
    }, [search, suppliers, data.supplier_id]);

    const submit = (addAnother: boolean) => {
        form.transform((d) => ({ ...d, add_another: addAnother }));

        if (receipt) {
            form.submit(update(receipt.id));
        } else {
            form.submit(store(), {
                // Keep the date, mode and deduction type for the next delivery in the queue.
                onSuccess: () =>
                    form.reset(
                        'supplier_id',
                        'vehicle_no',
                        'gross_kg',
                        'tare_kg',
                        'deduction_value',
                        'notes',
                    ),
            });
        }
    };

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                submit(false);
            }}
            className="grid gap-8 lg:grid-cols-[1fr_18rem]"
        >
            <div className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-[12rem_1fr]">
                    <div className="grid gap-2">
                        <Label htmlFor="received_on">{t('Date')}</Label>
                        <Input
                            id="received_on"
                            type="date"
                            value={data.received_on}
                            onChange={(e) =>
                                setData('received_on', e.target.value)
                            }
                            required
                        />
                        <InputError message={errors.received_on} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="supplier_id">{t('Supplier')}</Label>
                        <div className="flex gap-2">
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={t('Find…')}
                                className="w-28 shrink-0"
                                aria-label={t('Find supplier')}
                            />
                            <NativeSelect
                                id="supplier_id"
                                value={data.supplier_id}
                                onChange={(e) =>
                                    setData('supplier_id', e.target.value)
                                }
                                required
                                autoFocus={!receipt}
                            >
                                <option value="">
                                    {t('Choose a supplier')}
                                </option>
                                {visibleSuppliers.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.code ? `${s.code} · ` : ''}
                                        {s.name}
                                        {s.garden_name
                                            ? ` (${s.garden_name})`
                                            : ''}
                                    </option>
                                ))}
                            </NativeSelect>
                        </div>
                        <InputError message={errors.supplier_id} />
                    </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
                    <div className="grid gap-2">
                        <Label>{t('How did the leaf arrive?')}</Label>
                        <Choice
                            value={data.delivery_mode}
                            options={deliveryModes}
                            onChange={(v) =>
                                setData(
                                    'delivery_mode',
                                    v as 'supplier' | 'factory_vehicle',
                                )
                            }
                            label={t('How did the leaf arrive?')}
                        />
                        <InputError message={errors.delivery_mode} />
                    </div>
                    {byFactory ? (
                        <div className="grid gap-2">
                            <Label htmlFor="vehicle_id">
                                {t('Factory vehicle')}
                            </Label>
                            <NativeSelect
                                id="vehicle_id"
                                value={data.vehicle_id}
                                onChange={(e) =>
                                    setData('vehicle_id', e.target.value)
                                }
                                required
                            >
                                <option value="">
                                    {t('Choose a vehicle')}
                                </option>
                                {vehicles.map((v) => (
                                    <option key={v.id} value={v.id}>
                                        {v.name}
                                        {v.registration_no
                                            ? ` · ${v.registration_no}`
                                            : ''}
                                    </option>
                                ))}
                            </NativeSelect>
                            {vehicles.length === 0 && (
                                <p className="text-xs text-amber-700 dark:text-amber-400">
                                    {t(
                                        'No vehicles yet. Add the factory vehicles under Green leaf → Vehicles.',
                                    )}
                                </p>
                            )}
                            <InputError message={errors.vehicle_id} />
                        </div>
                    ) : (
                        <div className="grid gap-2">
                            <Label htmlFor="vehicle_no">
                                {t('Vehicle no.')}
                            </Label>
                            <Input
                                id="vehicle_no"
                                value={data.vehicle_no}
                                onChange={(e) =>
                                    setData('vehicle_no', e.target.value)
                                }
                                placeholder={t('Optional')}
                            />
                            <InputError message={errors.vehicle_no} />
                        </div>
                    )}
                </div>

                <div className="grid gap-6 sm:grid-cols-3">
                    <div className="grid gap-2">
                        <Label htmlFor="gross_kg">
                            {t('Gross weight (kg)')}
                        </Label>
                        <Input
                            id="gross_kg"
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min="0"
                            value={data.gross_kg}
                            onChange={(e) =>
                                setData('gross_kg', e.target.value)
                            }
                            required
                            className="text-lg"
                        />
                        <InputError message={errors.gross_kg} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="tare_kg">
                            {t('Bags / basket weight (kg)')}
                        </Label>
                        <Input
                            id="tare_kg"
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min="0"
                            value={data.tare_kg}
                            onChange={(e) => setData('tare_kg', e.target.value)}
                            className="text-lg"
                        />
                        <InputError message={errors.tare_kg} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="deduction_value">
                            {t('Moisture deduction')}
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                id="deduction_value"
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                min="0"
                                max={
                                    data.deduction_type === 'percent'
                                        ? 100
                                        : undefined
                                }
                                value={data.deduction_value}
                                onChange={(e) =>
                                    setData('deduction_value', e.target.value)
                                }
                                required
                                className="min-w-0 text-lg"
                            />
                            <Choice
                                value={data.deduction_type}
                                options={deductionTypes}
                                onChange={(v) =>
                                    setData(
                                        'deduction_type',
                                        v as 'kg' | 'percent',
                                    )
                                }
                                label={t('Deduct in kg or %')}
                                compact
                            />
                        </div>
                        <InputError message={errors.deduction_value} />
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="notes">{t('Notes')}</Label>
                    <Input
                        id="notes"
                        value={data.notes}
                        onChange={(e) => setData('notes', e.target.value)}
                        placeholder={t('Optional')}
                    />
                    <InputError message={errors.notes} />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Button type="submit" disabled={processing}>
                        {processing && <Spinner />}
                        {receipt ? t('Save changes') : t('Save & print slip')}
                    </Button>
                    {!receipt && (
                        <Button
                            type="button"
                            variant="outline"
                            disabled={processing}
                            onClick={() => submit(true)}
                        >
                            {t('Save & add another')}
                        </Button>
                    )}
                    <Button variant="ghost" asChild>
                        <Link
                            href={index({
                                query: { date: data.received_on || undefined },
                            })}
                        >
                            {t('Cancel')}
                        </Link>
                    </Button>
                </div>
            </div>

            <aside className="h-fit space-y-3 rounded-xl border bg-muted/30 p-5 text-sm">
                <p className="font-medium">{t('Calculation')}</p>
                <dl className="space-y-2">
                    <div className="flex justify-between">
                        <dt className="text-muted-foreground">
                            {t('Moisture deduction')}
                        </dt>
                        <dd className="whitespace-nowrap tabular-nums">
                            − {f.kg(preview.deduction)}
                        </dd>
                    </div>
                    <div className="flex justify-between text-base font-semibold">
                        <dt>{t('Net weight')}</dt>
                        <dd className="whitespace-nowrap tabular-nums">
                            {f.kg(preview.net)}
                        </dd>
                    </div>
                    <div className="flex justify-between">
                        <dt className="text-muted-foreground">
                            {byFactory ? t('Site rate') : t('Rate')}
                        </dt>
                        <dd className="whitespace-nowrap tabular-nums">
                            {preview.rate
                                ? `${f.money(preview.rate)} / kg`
                                : t('Not set yet')}
                        </dd>
                    </div>
                    <div className="flex justify-between border-t pt-2 text-base font-semibold">
                        <dt>{t('Amount')}</dt>
                        <dd className="whitespace-nowrap tabular-nums">
                            {preview.amount === null
                                ? '—'
                                : f.money(preview.amount)}
                        </dd>
                    </div>
                </dl>
                {!preview.rate && (
                    <p className="text-xs text-muted-foreground">
                        {byFactory
                            ? t(
                                  'Leaf collected by a factory vehicle is priced at the site rate, filled in when the day’s site rate is set.',
                              )
                            : t(
                                  'The amount is filled in automatically when the rate for this day is set.',
                              )}
                    </p>
                )}
            </aside>
        </form>
    );
}

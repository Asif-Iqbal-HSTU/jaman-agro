import { Link, useForm } from '@inertiajs/react';
import type { ReactNode } from 'react';
import InputError from '@/components/input-error';
import { NativeSelect } from '@/components/native-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useFormat } from '@/hooks/use-format';
import { useTrans } from '@/hooks/use-trans';
import { index, store, update } from '@/routes/auction-invoices';
import type { AuctionInvoice, Option, TeaGrade } from '@/types';

type Props = {
    grades: TeaGrade[];
    brokers: { id: number; name: string }[];
    warehouses: { id: number; name: string; location: string | null }[];
    balances: Record<string, string>;
    packageTypes: Option[];
    today: string;
    invoice?: AuctionInvoice;
    nextNumber?: string;
};

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

function Field({
    id,
    label,
    error,
    children,
    hint,
}: {
    id: string;
    label: string;
    error?: string;
    children: ReactNode;
    hint?: ReactNode;
}) {
    return (
        <div className="grid content-start gap-2">
            <Label htmlFor={id}>{label}</Label>
            {children}
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
            <InputError message={error} />
        </div>
    );
}

export function InvoiceForm({
    grades,
    brokers,
    warehouses,
    balances,
    packageTypes,
    today,
    invoice,
    nextNumber,
}: Props) {
    const { t } = useTrans();
    const f = useFormat();

    const form = useForm({
        invoice_no: invoice?.invoice_no ?? nextNumber ?? '',
        packed_on: invoice?.packed_on ?? today,
        tea_grade_id: String(invoice?.tea_grade_id ?? ''),
        package_type: invoice?.package_type ?? 'bag',
        packages: String(invoice?.packages ?? ''),
        kg_per_package: invoice?.kg_per_package ?? '',
        broker_id: String(invoice?.broker_id ?? ''),
        warehouse_id: String(invoice?.warehouse_id ?? ''),
        auction_centre: invoice?.auction_centre ?? '',
        sale_no: invoice?.sale_no ?? '',
        lot_no: invoice?.lot_no ?? '',
        dispatched_on: invoice?.dispatched_on ?? '',
        sold_on: invoice?.sold_on ?? '',
        buyer: invoice?.buyer ?? '',
        price_per_kg: invoice?.price_per_kg ?? '',
        deductions: invoice?.deductions ?? '',
        paid_on: invoice?.paid_on ?? '',
        payment_reference: invoice?.payment_reference ?? '',
        notes: invoice?.notes ?? '',
    });
    const { data, setData, errors, processing } = form;
    const text = (key: keyof typeof data) => ({
        id: key,
        value: data[key],
        onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
            setData(key, e.target.value),
    });

    const netKg = round2(
        Number(data.packages || 0) * Number(data.kg_per_package || 0),
    );
    const gross = data.price_per_kg
        ? round2(netKg * Number(data.price_per_kg))
        : null;
    const net =
        gross === null ? null : round2(gross - Number(data.deductions || 0));

    // Stock this invoice may use: what is free now, plus what it already holds.
    const available =
        data.tea_grade_id === ''
            ? null
            : Number(balances[data.tea_grade_id] ?? 0) +
              (invoice && String(invoice.tea_grade_id) === data.tea_grade_id
                  ? Number(invoice.net_kg)
                  : 0);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.submit(invoice ? update(invoice.id) : store());
    };

    return (
        <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_18rem]">
            <div className="space-y-10">
                <section className="space-y-6">
                    <h2 className="font-medium">{t('Packing')}</h2>
                    <div className="grid gap-6 sm:grid-cols-3">
                        <Field
                            id="invoice_no"
                            label={t('Invoice no.')}
                            error={errors.invoice_no}
                        >
                            <Input
                                {...text('invoice_no')}
                                required
                                className="font-mono"
                            />
                        </Field>
                        <Field
                            id="packed_on"
                            label={t('Packed on')}
                            error={errors.packed_on}
                        >
                            <Input
                                {...text('packed_on')}
                                type="date"
                                max={today}
                                required
                            />
                        </Field>
                        <Field
                            id="tea_grade_id"
                            label={t('Grade')}
                            error={errors.tea_grade_id}
                            hint={
                                available !== null &&
                                t('Available: :kg', { kg: f.kg(available) })
                            }
                        >
                            <NativeSelect
                                id="tea_grade_id"
                                value={data.tea_grade_id}
                                onChange={(e) =>
                                    setData('tea_grade_id', e.target.value)
                                }
                                required
                            >
                                <option value="">{t('Choose a grade')}</option>
                                {grades.map((g) => (
                                    <option key={g.id} value={g.id}>
                                        {g.code}
                                    </option>
                                ))}
                            </NativeSelect>
                        </Field>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-3">
                        <Field
                            id="package_type"
                            label={t('Packed in')}
                            error={errors.package_type}
                        >
                            <NativeSelect
                                id="package_type"
                                value={data.package_type}
                                onChange={(e) =>
                                    setData(
                                        'package_type',
                                        e.target.value as 'chest' | 'bag',
                                    )
                                }
                            >
                                {packageTypes.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </NativeSelect>
                        </Field>
                        <Field
                            id="packages"
                            label={t('Number of packages')}
                            error={errors.packages}
                        >
                            <Input
                                {...text('packages')}
                                type="number"
                                min="1"
                                step="1"
                                required
                            />
                        </Field>
                        <Field
                            id="kg_per_package"
                            label={t('Net kg per package')}
                            error={errors.kg_per_package}
                        >
                            <Input
                                {...text('kg_per_package')}
                                type="number"
                                min="0"
                                step="0.01"
                                required
                            />
                        </Field>
                    </div>
                </section>

                <section className="space-y-6">
                    <h2 className="font-medium">{t('Auction')}</h2>
                    <div className="grid gap-6 sm:grid-cols-3">
                        <Field
                            id="warehouse_id"
                            label={t('Warehouse')}
                            error={errors.warehouse_id}
                        >
                            <NativeSelect
                                id="warehouse_id"
                                value={data.warehouse_id}
                                onChange={(e) =>
                                    setData('warehouse_id', e.target.value)
                                }
                            >
                                <option value="">{t('Not chosen yet')}</option>
                                {warehouses.map((w) => (
                                    <option key={w.id} value={w.id}>
                                        {w.name}
                                        {w.location ? ` · ${w.location}` : ''}
                                    </option>
                                ))}
                            </NativeSelect>
                        </Field>
                        <Field
                            id="broker_id"
                            label={t('Broker')}
                            error={errors.broker_id}
                        >
                            <NativeSelect
                                id="broker_id"
                                value={data.broker_id}
                                onChange={(e) =>
                                    setData('broker_id', e.target.value)
                                }
                            >
                                <option value="">{t('Not chosen yet')}</option>
                                {brokers.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </NativeSelect>
                        </Field>
                        <Field
                            id="auction_centre"
                            label={t('Auction centre')}
                            error={errors.auction_centre}
                        >
                            <Input
                                {...text('auction_centre')}
                                placeholder={t(
                                    'e.g. Chattogram, Srimangal, Panchagarh',
                                )}
                            />
                        </Field>
                    </div>
                    {invoice && (
                        <div className="grid gap-6 sm:grid-cols-3">
                            <Field
                                id="dispatched_on"
                                label={t('Dispatched on')}
                                error={errors.dispatched_on}
                            >
                                <Input
                                    {...text('dispatched_on')}
                                    type="date"
                                    max={today}
                                />
                            </Field>
                            <Field
                                id="sale_no"
                                label={t('Sale no.')}
                                error={errors.sale_no}
                            >
                                <Input {...text('sale_no')} />
                            </Field>
                            <Field
                                id="lot_no"
                                label={t('Lot no.')}
                                error={errors.lot_no}
                            >
                                <Input {...text('lot_no')} />
                            </Field>
                        </div>
                    )}
                </section>

                {invoice && (
                    <section className="space-y-6">
                        <h2 className="font-medium">{t('Auction result')}</h2>
                        <div className="grid gap-6 sm:grid-cols-2">
                            <Field
                                id="sold_on"
                                label={t('Sold on')}
                                error={errors.sold_on}
                            >
                                <Input
                                    {...text('sold_on')}
                                    type="date"
                                    max={today}
                                />
                            </Field>
                            <Field
                                id="buyer"
                                label={t('Buyer')}
                                error={errors.buyer}
                            >
                                <Input {...text('buyer')} />
                            </Field>
                        </div>
                        <div className="grid gap-6 sm:grid-cols-2">
                            <Field
                                id="price_per_kg"
                                label={t('Price per kg (৳)')}
                                error={errors.price_per_kg}
                            >
                                <Input
                                    {...text('price_per_kg')}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                />
                            </Field>
                            <Field
                                id="deductions"
                                label={t('Broker deductions (৳)')}
                                error={errors.deductions}
                                hint={t(
                                    'Brokerage, warehouse charges, taxes and the like.',
                                )}
                            >
                                <Input
                                    {...text('deductions')}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                />
                            </Field>
                        </div>
                        <div className="grid gap-6 sm:grid-cols-2">
                            <Field
                                id="paid_on"
                                label={t('Payment received on')}
                                error={errors.paid_on}
                            >
                                <Input
                                    {...text('paid_on')}
                                    type="date"
                                    max={today}
                                />
                            </Field>
                            <Field
                                id="payment_reference"
                                label={t('Payment reference')}
                                error={errors.payment_reference}
                            >
                                <Input
                                    {...text('payment_reference')}
                                    placeholder={t('Cheque, transaction ID…')}
                                />
                            </Field>
                        </div>
                    </section>
                )}

                <Field id="notes" label={t('Notes')} error={errors.notes}>
                    <Input {...text('notes')} placeholder={t('Optional')} />
                </Field>

                <div className="flex items-center gap-3">
                    <Button type="submit" disabled={processing}>
                        {processing && <Spinner />}
                        {invoice ? t('Save changes') : t('Pack invoice')}
                    </Button>
                    <Button variant="ghost" asChild>
                        <Link href={index()}>{t('Cancel')}</Link>
                    </Button>
                </div>
            </div>

            <aside className="h-fit space-y-3 rounded-xl border bg-muted/30 p-5 text-sm lg:sticky lg:top-4">
                <p className="font-medium">{t('Invoice')}</p>
                <dl className="space-y-2">
                    <div className="flex justify-between text-base font-semibold">
                        <dt>{t('Net weight')}</dt>
                        <dd className="whitespace-nowrap tabular-nums">
                            {f.kg(netKg)}
                        </dd>
                    </div>
                    {available !== null && netKg > available && (
                        <p className="text-xs text-red-700 dark:text-red-400">
                            {t('More than the stock of this grade.')}
                        </p>
                    )}
                    {invoice && (
                        <>
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">
                                    {t('Gross amount')}
                                </dt>
                                <dd className="whitespace-nowrap tabular-nums">
                                    {gross === null ? '—' : f.money(gross)}
                                </dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">
                                    {t('Deductions')}
                                </dt>
                                <dd className="whitespace-nowrap tabular-nums">
                                    − {f.money(data.deductions || 0)}
                                </dd>
                            </div>
                            <div className="flex justify-between border-t pt-2 text-base font-semibold">
                                <dt>{t('Net proceeds')}</dt>
                                <dd className="whitespace-nowrap tabular-nums">
                                    {net === null ? '—' : f.money(net)}
                                </dd>
                            </div>
                        </>
                    )}
                </dl>
                {!invoice && (
                    <p className="text-xs text-muted-foreground">
                        {t(
                            'Packing takes this tea out of the made tea stock. Fill in dispatch, the auction result and payment later from the invoice list.',
                        )}
                    </p>
                )}
                <InputError message={errors.packages} />
            </aside>
        </form>
    );
}

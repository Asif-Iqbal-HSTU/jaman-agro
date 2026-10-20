import { Head, Link, useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { NativeSelect } from '@/components/native-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useFormat } from '@/hooks/use-format';
import { useTrans } from '@/hooks/use-trans';
import { create, index, store } from '@/routes/retail-sales';
import type { Option, TeaGrade } from '@/types';

type Props = {
    grades: TeaGrade[];
    balances: Record<string, string>;
    customers: { id: number; name: string; phone: string | null }[];
    customerId: number | null;
    methods: Option[];
    today: string;
};

type Line = { tea_grade_id: string; kg: string; rate: string };

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const emptyLine: Line = { tea_grade_id: '', kg: '', rate: '' };

export default function CreateRetailSale({
    grades,
    balances,
    customers,
    customerId,
    methods,
    today,
}: Props) {
    const { t } = useTrans();
    const f = useFormat();

    const form = useForm({
        sold_on: today,
        customer_id: String(customerId ?? ''),
        items: [{ ...emptyLine }] as Line[],
        paid_amount: '',
        method: 'cash',
        reference: '',
        notes: '',
    });
    const { data, setData, errors, processing } = form;
    const fieldErrors = errors as Record<string, string | undefined>;

    const lineAmount = (l: Line) =>
        round2(Number(l.kg || 0) * Number(l.rate || 0));
    const total = round2(data.items.reduce((sum, l) => sum + lineAmount(l), 0));
    const walkIn = data.customer_id === '';
    const paid = walkIn ? total : Number(data.paid_amount || 0);
    const due = round2(total - paid);

    const setLine = (i: number, patch: Partial<Line>) =>
        setData(
            'items',
            data.items.map((l, j) => (j === i ? { ...l, ...patch } : l)),
        );

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        // A walk-in sale is always paid in full on the spot.
        form.transform((d) => ({
            ...d,
            paid_amount: walkIn ? String(total) : d.paid_amount,
        }));
        form.submit(store());
    };

    return (
        <>
            <Head title={t('New sale')} />
            <div className="p-4 md:p-6">
                <Heading
                    title={t('New sale')}
                    description={t(
                        'A retail sale memo. The tea comes out of stock.',
                    )}
                />

                <form
                    onSubmit={submit}
                    className="grid gap-8 lg:grid-cols-[1fr_18rem]"
                >
                    <div className="space-y-8">
                        <div className="grid gap-6 sm:grid-cols-[12rem_1fr]">
                            <div className="grid gap-2">
                                <Label htmlFor="sold_on">{t('Date')}</Label>
                                <Input
                                    id="sold_on"
                                    type="date"
                                    max={today}
                                    value={data.sold_on}
                                    onChange={(e) =>
                                        setData('sold_on', e.target.value)
                                    }
                                    required
                                />
                                <InputError message={errors.sold_on} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="customer_id">
                                    {t('Customer')}
                                </Label>
                                <NativeSelect
                                    id="customer_id"
                                    value={data.customer_id}
                                    onChange={(e) =>
                                        setData('customer_id', e.target.value)
                                    }
                                >
                                    <option value="">
                                        {t('Walk-in (cash, paid in full)')}
                                    </option>
                                    {customers.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                            {c.phone ? ` · ${c.phone}` : ''}
                                        </option>
                                    ))}
                                </NativeSelect>
                                <InputError message={errors.customer_id} />
                            </div>
                        </div>

                        <section>
                            <h2 className="mb-3 font-medium">
                                {t('Tea sold')}
                            </h2>
                            <div className="space-y-3">
                                {data.items.map((line, i) => (
                                    <div
                                        key={i}
                                        className="grid grid-cols-2 items-start gap-2 sm:grid-cols-[1fr_8rem_8rem_8rem_auto]"
                                    >
                                        <div className="col-span-2 sm:col-span-1">
                                            <NativeSelect
                                                value={line.tea_grade_id}
                                                onChange={(e) =>
                                                    setLine(i, {
                                                        tea_grade_id:
                                                            e.target.value,
                                                    })
                                                }
                                                aria-label={t('Grade')}
                                                required
                                            >
                                                <option value="">
                                                    {t('Choose a grade')}
                                                </option>
                                                {grades.map((g) => (
                                                    <option
                                                        key={g.id}
                                                        value={g.id}
                                                    >
                                                        {g.code} ·{' '}
                                                        {t('in stock :kg', {
                                                            kg: f.kg(
                                                                balances[
                                                                    g.id
                                                                ] ?? 0,
                                                            ),
                                                        })}
                                                    </option>
                                                ))}
                                            </NativeSelect>
                                            <InputError
                                                message={
                                                    fieldErrors[
                                                        `items.${i}.tea_grade_id`
                                                    ]
                                                }
                                            />
                                        </div>
                                        <div>
                                            <Input
                                                type="number"
                                                inputMode="decimal"
                                                min="0"
                                                step="0.01"
                                                placeholder={t('kg')}
                                                aria-label={t('Quantity (kg)')}
                                                value={line.kg}
                                                onChange={(e) =>
                                                    setLine(i, {
                                                        kg: e.target.value,
                                                    })
                                                }
                                                required
                                            />
                                            <InputError
                                                message={
                                                    fieldErrors[`items.${i}.kg`]
                                                }
                                            />
                                        </div>
                                        <div>
                                            <Input
                                                type="number"
                                                inputMode="decimal"
                                                min="0"
                                                step="0.01"
                                                placeholder={t('৳ per kg')}
                                                aria-label={t('Rate')}
                                                value={line.rate}
                                                onChange={(e) =>
                                                    setLine(i, {
                                                        rate: e.target.value,
                                                    })
                                                }
                                                required
                                            />
                                            <InputError
                                                message={
                                                    fieldErrors[
                                                        `items.${i}.rate`
                                                    ]
                                                }
                                            />
                                        </div>
                                        <p className="flex h-9 items-center justify-end font-medium tabular-nums">
                                            {f.money(lineAmount(line))}
                                        </p>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            disabled={data.items.length === 1}
                                            onClick={() =>
                                                setData(
                                                    'items',
                                                    data.items.filter(
                                                        (_, j) => j !== i,
                                                    ),
                                                )
                                            }
                                            aria-label={t('Remove line')}
                                        >
                                            <Trash2 />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-3"
                                onClick={() =>
                                    setData('items', [
                                        ...data.items,
                                        { ...emptyLine },
                                    ])
                                }
                            >
                                <Plus /> {t('Add another grade')}
                            </Button>
                            <InputError
                                message={errors.items}
                                className="mt-2"
                            />
                        </section>

                        <section className="space-y-6">
                            <h2 className="font-medium">{t('Payment')}</h2>
                            <div className="grid gap-6 sm:grid-cols-3">
                                <div className="grid gap-2">
                                    <Label htmlFor="paid_amount">
                                        {t('Received now (৳)')}
                                    </Label>
                                    <Input
                                        id="paid_amount"
                                        type="number"
                                        inputMode="decimal"
                                        min="0"
                                        step="0.01"
                                        value={
                                            walkIn
                                                ? String(total)
                                                : data.paid_amount
                                        }
                                        disabled={walkIn}
                                        onChange={(e) =>
                                            setData(
                                                'paid_amount',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    {!walkIn && (
                                        <button
                                            type="button"
                                            className="w-fit text-xs text-primary hover:underline"
                                            onClick={() =>
                                                setData(
                                                    'paid_amount',
                                                    String(total),
                                                )
                                            }
                                        >
                                            {t('Paid in full')}
                                        </button>
                                    )}
                                    <InputError message={errors.paid_amount} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="method">
                                        {t('Paid by')}
                                    </Label>
                                    <NativeSelect
                                        id="method"
                                        value={data.method}
                                        onChange={(e) =>
                                            setData('method', e.target.value)
                                        }
                                    >
                                        {methods.map((o) => (
                                            <option
                                                key={o.value}
                                                value={o.value}
                                            >
                                                {o.label}
                                            </option>
                                        ))}
                                    </NativeSelect>
                                    <InputError message={errors.method} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="reference">
                                        {t('Reference')}
                                    </Label>
                                    <Input
                                        id="reference"
                                        value={data.reference}
                                        onChange={(e) =>
                                            setData('reference', e.target.value)
                                        }
                                        placeholder={t('Optional')}
                                    />
                                    <InputError message={errors.reference} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="notes">{t('Notes')}</Label>
                                <Input
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) =>
                                        setData('notes', e.target.value)
                                    }
                                    placeholder={t('Optional')}
                                />
                                <InputError message={errors.notes} />
                            </div>
                        </section>

                        <div className="flex items-center gap-3">
                            <Button type="submit" disabled={processing}>
                                {processing && <Spinner />}
                                {t('Save & print memo')}
                            </Button>
                            <Button variant="ghost" asChild>
                                <Link href={index()}>{t('Cancel')}</Link>
                            </Button>
                        </div>
                    </div>

                    <aside className="h-fit space-y-3 rounded-xl border bg-muted/30 p-5 text-sm lg:sticky lg:top-4">
                        <p className="font-medium">{t('Memo')}</p>
                        <dl className="space-y-2">
                            <div className="flex justify-between text-base font-semibold">
                                <dt>{t('Total')}</dt>
                                <dd className="whitespace-nowrap tabular-nums">
                                    {f.money(total)}
                                </dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">
                                    {t('Received now')}
                                </dt>
                                <dd className="whitespace-nowrap tabular-nums">
                                    {f.money(paid)}
                                </dd>
                            </div>
                            <div className="flex justify-between border-t pt-2 text-base font-semibold">
                                <dt>{t('Added to customer due')}</dt>
                                <dd className="whitespace-nowrap tabular-nums">
                                    {f.money(Math.max(due, 0))}
                                </dd>
                            </div>
                        </dl>
                    </aside>
                </form>
            </div>
        </>
    );
}

CreateRetailSale.layout = {
    breadcrumbs: [
        { title: 'Retail sales', href: index() },
        { title: 'New sale', href: create() },
    ],
};

import { Form, Link } from '@inertiajs/react';
import type { ComponentProps } from 'react';
import InputError from '@/components/input-error';
import { NativeSelect } from '@/components/native-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useTrans } from '@/hooks/use-trans';
import { index } from '@/routes/supplier-payments';
import type { Option, SupplierPayment, SupplierSummary } from '@/types';

type Props = {
    form: Pick<ComponentProps<typeof Form>, 'action' | 'method'>;
    suppliers: SupplierSummary[];
    types: Option[];
    methods: Option[];
    payment?: SupplierPayment;
    supplierId?: number | null;
    today?: string;
};

export function PaymentForm({
    form,
    suppliers,
    types,
    methods,
    payment,
    supplierId,
    today,
}: Props) {
    const { t } = useTrans();

    return (
        <Form {...form} className="max-w-2xl space-y-6">
            {({ processing, errors }) => (
                <>
                    <div className="grid gap-6 sm:grid-cols-[12rem_1fr]">
                        <div className="grid gap-2">
                            <Label htmlFor="paid_on">{t('Date')}</Label>
                            <Input
                                id="paid_on"
                                name="paid_on"
                                type="date"
                                defaultValue={payment?.paid_on ?? today}
                                required
                            />
                            <InputError message={errors.paid_on} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="supplier_id">{t('Supplier')}</Label>
                            <NativeSelect
                                id="supplier_id"
                                name="supplier_id"
                                defaultValue={String(
                                    payment?.supplier_id ?? supplierId ?? '',
                                )}
                                required
                            >
                                <option value="">
                                    {t('Choose a supplier')}
                                </option>
                                {suppliers.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.code ? `${s.code} · ` : ''}
                                        {s.name}
                                    </option>
                                ))}
                            </NativeSelect>
                            <InputError message={errors.supplier_id} />
                        </div>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-3">
                        <div className="grid gap-2">
                            <Label htmlFor="type">{t('Type')}</Label>
                            <NativeSelect
                                id="type"
                                name="type"
                                defaultValue={payment?.type ?? 'payment'}
                            >
                                {types.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </NativeSelect>
                            <InputError message={errors.type} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="method">{t('Paid by')}</Label>
                            <NativeSelect
                                id="method"
                                name="method"
                                defaultValue={payment?.method ?? 'cash'}
                            >
                                {methods.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </NativeSelect>
                            <InputError message={errors.method} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="amount">{t('Amount (৳)')}</Label>
                            <Input
                                id="amount"
                                name="amount"
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                min="0"
                                defaultValue={payment?.amount}
                                required
                                className="text-lg"
                            />
                            <InputError message={errors.amount} />
                        </div>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="reference">{t('Reference')}</Label>
                            <Input
                                id="reference"
                                name="reference"
                                defaultValue={payment?.reference ?? ''}
                                placeholder={t('Cheque, transaction ID…')}
                            />
                            <InputError message={errors.reference} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="notes">{t('Notes')}</Label>
                            <Input
                                id="notes"
                                name="notes"
                                defaultValue={payment?.notes ?? ''}
                            />
                            <InputError message={errors.notes} />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button disabled={processing}>
                            {processing && <Spinner />}
                            {payment ? t('Save changes') : t('Record payment')}
                        </Button>
                        <Button variant="ghost" asChild>
                            <Link href={index()}>{t('Cancel')}</Link>
                        </Button>
                    </div>
                </>
            )}
        </Form>
    );
}

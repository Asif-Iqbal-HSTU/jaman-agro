import { Form, Link } from '@inertiajs/react';
import { useState } from 'react';
import type { ComponentProps } from 'react';
import InputError from '@/components/input-error';
import { NativeSelect } from '@/components/native-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useTrans } from '@/hooks/use-trans';
import { index } from '@/routes/expenses';
import type { Lockable, Option } from '@/types';

export type Expense = Lockable & {
    id: number;
    spent_on: string;
    expense_category_id: number;
    category?: { id: number; name: string; kind?: 'factory' | 'vehicle' };
    vehicle_id: number | null;
    vehicle?: { id: number; name: string } | null;
    recorder?: { id: number; name: string } | null;
    amount: string;
    method: string;
    paid_to: string | null;
    reference: string | null;
    notes: string | null;
};

type Props = {
    form: Pick<ComponentProps<typeof Form>, 'action' | 'method'>;
    categories: { id: number; name: string; kind: 'factory' | 'vehicle' }[];
    vehicles: { id: number; name: string; registration_no: string | null }[];
    methods: Option[];
    today: string;
    expense?: Expense;
};

export function ExpenseForm({
    form,
    categories,
    vehicles,
    methods,
    today,
    expense,
}: Props) {
    const { t } = useTrans();
    const [categoryId, setCategoryId] = useState(
        String(expense?.expense_category_id ?? ''),
    );
    // Vehicle expenses (fuel, driver, repairs) are booked to one factory vehicle.
    const forVehicle =
        categories.find((c) => String(c.id) === categoryId)?.kind === 'vehicle';

    return (
        <Form {...form} className="max-w-2xl space-y-6">
            {({ processing, errors }) => (
                <>
                    <div className="grid gap-6 sm:grid-cols-[12rem_1fr]">
                        <div className="grid gap-2">
                            <Label htmlFor="spent_on">{t('Date')}</Label>
                            <Input
                                id="spent_on"
                                name="spent_on"
                                type="date"
                                max={today}
                                defaultValue={expense?.spent_on ?? today}
                                required
                            />
                            <InputError message={errors.spent_on} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="expense_category_id">
                                {t('Category')}
                            </Label>
                            <NativeSelect
                                id="expense_category_id"
                                name="expense_category_id"
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                required
                            >
                                <option value="">
                                    {t('Choose a category')}
                                </option>
                                <optgroup label={t('Factory')}>
                                    {categories
                                        .filter((c) => c.kind === 'factory')
                                        .map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {t(c.name)}
                                            </option>
                                        ))}
                                </optgroup>
                                <optgroup label={t('Vehicle')}>
                                    {categories
                                        .filter((c) => c.kind === 'vehicle')
                                        .map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {t(c.name)}
                                            </option>
                                        ))}
                                </optgroup>
                            </NativeSelect>
                            <InputError message={errors.expense_category_id} />
                        </div>
                    </div>

                    {forVehicle && (
                        <div className="grid max-w-sm gap-2">
                            <Label htmlFor="vehicle_id">
                                {t('Factory vehicle')}
                            </Label>
                            <NativeSelect
                                id="vehicle_id"
                                name="vehicle_id"
                                defaultValue={String(expense?.vehicle_id ?? '')}
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
                            <InputError message={errors.vehicle_id} />
                        </div>
                    )}

                    <div className="grid gap-6 sm:grid-cols-3">
                        <div className="grid gap-2">
                            <Label htmlFor="amount">{t('Amount (৳)')}</Label>
                            <Input
                                id="amount"
                                name="amount"
                                type="number"
                                inputMode="decimal"
                                min="0"
                                step="0.01"
                                defaultValue={expense?.amount}
                                required
                                className="text-lg"
                            />
                            <InputError message={errors.amount} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="method">{t('Paid by')}</Label>
                            <NativeSelect
                                id="method"
                                name="method"
                                defaultValue={expense?.method ?? 'cash'}
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
                            <Label htmlFor="paid_to">{t('Paid to')}</Label>
                            <Input
                                id="paid_to"
                                name="paid_to"
                                defaultValue={expense?.paid_to ?? ''}
                                placeholder={t('Optional')}
                            />
                            <InputError message={errors.paid_to} />
                        </div>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="reference">{t('Reference')}</Label>
                            <Input
                                id="reference"
                                name="reference"
                                defaultValue={expense?.reference ?? ''}
                                placeholder={t('Bill or voucher no.')}
                            />
                            <InputError message={errors.reference} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="notes">{t('Notes')}</Label>
                            <Input
                                id="notes"
                                name="notes"
                                defaultValue={expense?.notes ?? ''}
                            />
                            <InputError message={errors.notes} />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button disabled={processing}>
                            {processing && <Spinner />}
                            {expense ? t('Save changes') : t('Record expense')}
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

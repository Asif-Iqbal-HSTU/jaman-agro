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
import { cn } from '@/lib/utils';
import { index } from '@/routes/suppliers';
import type { Supplier } from '@/types';

type Props = {
    form: Pick<ComponentProps<typeof Form>, 'action' | 'method'>;
    supplier?: Supplier;
};

export function SupplierForm({ form, supplier }: Props) {
    const { t } = useTrans();
    // Stored signed (an advance is negative); shown as a type and a plain amount.
    const opening = Number(supplier?.opening_balance ?? 0);
    const [openingType, setOpeningType] = useState<'payable' | 'advance'>(
        opening < 0 ? 'advance' : 'payable',
    );
    const openingAmount = opening === 0 ? '0' : Math.abs(opening).toFixed(2);

    return (
        <Form {...form} className="max-w-2xl space-y-6">
            {({ processing, errors }) => (
                <>
                    <div className="grid gap-6 sm:grid-cols-[1fr_10rem]">
                        <div className="grid gap-2">
                            <Label htmlFor="name">{t('Supplier name')}</Label>
                            <Input
                                id="name"
                                name="name"
                                defaultValue={supplier?.name}
                                required
                                autoFocus
                            />
                            <InputError message={errors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="code">{t('Supplier code')}</Label>
                            <Input
                                id="code"
                                name="code"
                                defaultValue={supplier?.code ?? ''}
                                placeholder={t('Optional')}
                            />
                            <InputError message={errors.code} />
                        </div>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="garden_name">
                                {t('Garden name')}
                            </Label>
                            <Input
                                id="garden_name"
                                name="garden_name"
                                defaultValue={supplier?.garden_name ?? ''}
                            />
                            <InputError message={errors.garden_name} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone">{t('Phone')}</Label>
                            <Input
                                id="phone"
                                name="phone"
                                type="tel"
                                defaultValue={supplier?.phone ?? ''}
                                placeholder="01XXXXXXXXX"
                            />
                            <InputError message={errors.phone} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="address">{t('Address')}</Label>
                        <Input
                            id="address"
                            name="address"
                            defaultValue={supplier?.address ?? ''}
                        />
                        <InputError message={errors.address} />
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="opening_amount">
                                {t('Opening balance (৳)')}
                            </Label>
                            <input
                                type="hidden"
                                name="opening_type"
                                value={openingType}
                            />
                            <div className="flex gap-2">
                                <div
                                    role="radiogroup"
                                    aria-label={t('Opening balance (৳)')}
                                    className="inline-flex shrink-0 gap-1 rounded-lg border p-1"
                                >
                                    {(['payable', 'advance'] as const).map(
                                        (type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                role="radio"
                                                aria-checked={
                                                    openingType === type
                                                }
                                                onClick={() =>
                                                    setOpeningType(type)
                                                }
                                                className={cn(
                                                    'rounded-md px-3 text-sm transition',
                                                    openingType === type
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'hover:bg-muted',
                                                )}
                                            >
                                                {type === 'payable'
                                                    ? t('Payable')
                                                    : t('Advance')}
                                            </button>
                                        ),
                                    )}
                                </div>
                                <Input
                                    id="opening_amount"
                                    name="opening_amount"
                                    type="number"
                                    inputMode="decimal"
                                    step="0.01"
                                    min="0"
                                    defaultValue={openingAmount}
                                    className="min-w-0"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {openingType === 'payable'
                                    ? t(
                                          'Payable: what the factory already owed this supplier on the day they were added.',
                                      )
                                    : t(
                                          'Advance: money the supplier had already taken from the factory, still to be covered by their leaf.',
                                      )}
                            </p>
                            <InputError
                                message={
                                    errors.opening_amount ?? errors.opening_type
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="is_active">{t('Status')}</Label>
                            <NativeSelect
                                id="is_active"
                                name="is_active"
                                defaultValue={
                                    supplier === undefined || supplier.is_active
                                        ? '1'
                                        : '0'
                                }
                            >
                                <option value="1">{t('Active')}</option>
                                <option value="0">{t('Inactive')}</option>
                            </NativeSelect>
                            <InputError message={errors.is_active} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="notes">{t('Notes')}</Label>
                        <textarea
                            id="notes"
                            name="notes"
                            rows={3}
                            defaultValue={supplier?.notes ?? ''}
                            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
                        />
                        <InputError message={errors.notes} />
                    </div>

                    <div className="flex items-center gap-3">
                        <Button disabled={processing}>
                            {processing && <Spinner />}
                            {supplier ? t('Save changes') : t('Add supplier')}
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

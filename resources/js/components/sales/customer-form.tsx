import { Form, Link } from '@inertiajs/react';
import type { ComponentProps } from 'react';
import InputError from '@/components/input-error';
import { NativeSelect } from '@/components/native-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useTrans } from '@/hooks/use-trans';
import { index } from '@/routes/customers';
import type { Customer } from '@/types';

type Props = {
    form: Pick<ComponentProps<typeof Form>, 'action' | 'method'>;
    customer?: Customer;
};

export function CustomerForm({ form, customer }: Props) {
    const { t } = useTrans();

    return (
        <Form {...form} className="max-w-2xl space-y-6">
            {({ processing, errors }) => (
                <>
                    <div className="grid gap-6 sm:grid-cols-[1fr_12rem]">
                        <div className="grid gap-2">
                            <Label htmlFor="name">{t('Customer name')}</Label>
                            <Input
                                id="name"
                                name="name"
                                defaultValue={customer?.name}
                                required
                                autoFocus
                            />
                            <InputError message={errors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone">{t('Phone')}</Label>
                            <Input
                                id="phone"
                                name="phone"
                                type="tel"
                                defaultValue={customer?.phone ?? ''}
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
                            defaultValue={customer?.address ?? ''}
                        />
                        <InputError message={errors.address} />
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="opening_balance">
                                {t('Opening balance (৳)')}
                            </Label>
                            <Input
                                id="opening_balance"
                                name="opening_balance"
                                type="number"
                                step="0.01"
                                defaultValue={customer?.opening_balance ?? '0'}
                            />
                            <p className="text-xs text-muted-foreground">
                                {t(
                                    'What this customer already owed the factory when they were added.',
                                )}
                            </p>
                            <InputError message={errors.opening_balance} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="is_active">{t('Status')}</Label>
                            <NativeSelect
                                id="is_active"
                                name="is_active"
                                defaultValue={
                                    customer === undefined || customer.is_active
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
                        <Input
                            id="notes"
                            name="notes"
                            defaultValue={customer?.notes ?? ''}
                        />
                        <InputError message={errors.notes} />
                    </div>

                    <div className="flex items-center gap-3">
                        <Button disabled={processing}>
                            {processing && <Spinner />}
                            {customer ? t('Save changes') : t('Add customer')}
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

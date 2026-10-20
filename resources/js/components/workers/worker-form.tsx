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
import { index } from '@/routes/workers';
import type { Option, Worker } from '@/types';

type Props = {
    form: Pick<ComponentProps<typeof Form>, 'action' | 'method'>;
    payTypes: Option[];
    worker?: Worker;
};

export function WorkerForm({ form, payTypes, worker }: Props) {
    const { t } = useTrans();
    const [payType, setPayType] = useState<string>(
        worker?.pay_type ?? 'hourly',
    );

    return (
        <Form {...form} className="max-w-2xl space-y-6">
            {({ processing, errors }) => (
                <>
                    <div className="grid gap-6 sm:grid-cols-[1fr_12rem]">
                        <div className="grid gap-2">
                            <Label htmlFor="name">{t('Worker name')}</Label>
                            <Input
                                id="name"
                                name="name"
                                defaultValue={worker?.name}
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
                                defaultValue={worker?.phone ?? ''}
                                placeholder="01XXXXXXXXX"
                            />
                            <InputError message={errors.phone} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>{t('How is this worker paid?')}</Label>
                        <input type="hidden" name="pay_type" value={payType} />
                        <div className="grid gap-3 sm:grid-cols-2">
                            {payTypes.map((o) => (
                                <button
                                    key={o.value}
                                    type="button"
                                    onClick={() => setPayType(o.value)}
                                    aria-pressed={payType === o.value}
                                    className={cn(
                                        'rounded-xl border p-4 text-left transition',
                                        payType === o.value
                                            ? 'border-primary ring-2 ring-primary/30'
                                            : 'hover:bg-muted/50',
                                    )}
                                >
                                    <p className="font-medium">{o.label}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {o.value === 'hourly'
                                            ? t(
                                                  'Time in and time out are recorded each day; pay is hours × hourly rate.',
                                              )
                                            : t(
                                                  'Paid for the work done: per kg, bag, ton or job, at the job rates.',
                                              )}
                                    </p>
                                </button>
                            ))}
                        </div>
                        <InputError message={errors.pay_type} />
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                        {payType === 'hourly' && (
                            <div className="grid gap-2">
                                <Label htmlFor="hourly_rate">
                                    {t('Hourly rate (৳)')}
                                </Label>
                                <Input
                                    id="hourly_rate"
                                    name="hourly_rate"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    defaultValue={worker?.hourly_rate ?? ''}
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    {t(
                                        'A changed rate applies to days recorded from now on.',
                                    )}
                                </p>
                                <InputError message={errors.hourly_rate} />
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label htmlFor="is_active">{t('Status')}</Label>
                            <NativeSelect
                                id="is_active"
                                name="is_active"
                                defaultValue={
                                    worker && !worker.is_active ? '0' : '1'
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
                            defaultValue={worker?.notes ?? ''}
                            placeholder={t('Optional')}
                        />
                        <InputError message={errors.notes} />
                    </div>

                    <div className="flex items-center gap-3">
                        <Button disabled={processing}>
                            {processing && <Spinner />}
                            {worker ? t('Save changes') : t('Add worker')}
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

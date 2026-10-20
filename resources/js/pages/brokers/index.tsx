import { Form, Head } from '@inertiajs/react';
import BrokerController from '@/actions/App/Http/Controllers/BrokerController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { NativeSelect } from '@/components/native-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTrans } from '@/hooks/use-trans';
import { index } from '@/routes/brokers';
import type { Broker } from '@/types';

function BrokerRow({ broker }: { broker?: Broker }) {
    const { t } = useTrans();
    const form = broker
        ? BrokerController.update.form(broker.id)
        : BrokerController.store.form();

    return (
        <Form
            {...form}
            options={{ preserveScroll: true }}
            resetOnSuccess={!broker}
            className="grid items-start gap-2 border-b p-3 last:border-b-0 sm:grid-cols-[1fr_1fr_9rem_8rem_auto]"
        >
            {({ processing, errors, isDirty }) => (
                <>
                    <div>
                        <Input
                            name="name"
                            defaultValue={broker?.name}
                            placeholder={t('Broker name')}
                            aria-label={t('Broker name')}
                            required
                            className="font-medium"
                        />
                        <InputError message={errors.name} />
                    </div>
                    <div>
                        <Input
                            name="contact_person"
                            defaultValue={broker?.contact_person ?? ''}
                            placeholder={t('Contact person')}
                            aria-label={t('Contact person')}
                        />
                        <InputError message={errors.contact_person} />
                    </div>
                    <div>
                        <Input
                            name="phone"
                            type="tel"
                            defaultValue={broker?.phone ?? ''}
                            placeholder={t('Phone')}
                            aria-label={t('Phone')}
                        />
                        <InputError message={errors.phone} />
                    </div>
                    <NativeSelect
                        name="is_active"
                        defaultValue={broker && !broker.is_active ? '0' : '1'}
                        aria-label={t('Status')}
                    >
                        <option value="1">{t('Active')}</option>
                        <option value="0">{t('Inactive')}</option>
                    </NativeSelect>
                    <Button
                        variant={broker ? 'outline' : 'default'}
                        disabled={
                            processing || (broker !== undefined && !isDirty)
                        }
                    >
                        {broker ? t('Save') : t('Add broker')}
                    </Button>
                </>
            )}
        </Form>
    );
}

export default function Brokers({ brokers }: { brokers: Broker[] }) {
    const { t } = useTrans();

    return (
        <>
            <Head title={t('Brokers')} />
            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title={t('Brokers')}
                    description={t(
                        'The tea brokers who catalogue and sell the factory invoices at auction.',
                    )}
                />

                {brokers.length > 0 && (
                    <div className="max-w-5xl rounded-xl border">
                        {brokers.map((b) => (
                            <BrokerRow
                                key={`${b.id}-${b.updated_at ?? ''}`}
                                broker={b}
                            />
                        ))}
                    </div>
                )}

                <div className="max-w-5xl">
                    <h2 className="mb-2 text-sm font-medium">
                        {t('New broker')}
                    </h2>
                    <div className="rounded-xl border border-dashed">
                        <BrokerRow />
                    </div>
                </div>
            </div>
        </>
    );
}

Brokers.layout = {
    breadcrumbs: [{ title: 'Brokers', href: index() }],
};

import { Form, Head } from '@inertiajs/react';
import PieceRateController from '@/actions/App/Http/Controllers/PieceRateController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { NativeSelect } from '@/components/native-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTrans } from '@/hooks/use-trans';
import { index } from '@/routes/piece-rates';
import type { Option, PieceRate } from '@/types';

function RateForm({ rate, units }: { rate?: PieceRate; units: Option[] }) {
    const { t } = useTrans();
    const form = rate
        ? PieceRateController.update.form(rate.id)
        : PieceRateController.store.form();

    return (
        <Form
            {...form}
            options={{ preserveScroll: true }}
            resetOnSuccess={!rate}
            className="grid items-start gap-2 border-b p-3 last:border-b-0 sm:grid-cols-[1fr_8rem_8rem_5rem_7rem_auto]"
        >
            {({ processing, errors, isDirty }) => (
                <>
                    <div>
                        <Input
                            name="name"
                            defaultValue={rate?.name}
                            placeholder={t('Job, e.g. Bagging')}
                            aria-label={t('Job')}
                            required
                            className="font-medium"
                        />
                        {rate && t(rate.name) !== rate.name && (
                            <p className="mt-1 text-xs text-muted-foreground">
                                {t(rate.name)}
                            </p>
                        )}
                        <InputError message={errors.name} />
                    </div>
                    <div>
                        <Input
                            name="rate"
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={rate?.rate ?? ''}
                            placeholder={t('Rate (৳)')}
                            aria-label={t('Rate (৳)')}
                            required
                        />
                        <InputError message={errors.rate} />
                    </div>
                    <div>
                        <NativeSelect
                            name="unit"
                            defaultValue={rate?.unit ?? 'bag'}
                            aria-label={t('Unit')}
                        >
                            {units.map((u) => (
                                <option key={u.value} value={u.value}>
                                    {u.label}
                                </option>
                            ))}
                        </NativeSelect>
                        <InputError message={errors.unit} />
                    </div>
                    <div>
                        <Input
                            name="sort_order"
                            type="number"
                            min="0"
                            defaultValue={rate?.sort_order ?? ''}
                            placeholder={t('Order')}
                            aria-label={t('Order')}
                        />
                        <InputError message={errors.sort_order} />
                    </div>
                    <NativeSelect
                        name="is_active"
                        defaultValue={rate && !rate.is_active ? '0' : '1'}
                        aria-label={t('Status')}
                    >
                        <option value="1">{t('Active')}</option>
                        <option value="0">{t('Inactive')}</option>
                    </NativeSelect>
                    <Button
                        variant={rate ? 'outline' : 'default'}
                        disabled={
                            processing || (rate !== undefined && !isDirty)
                        }
                    >
                        {rate ? t('Save') : t('Add job')}
                    </Button>
                </>
            )}
        </Form>
    );
}

export default function PieceRates({
    rates,
    units,
}: {
    rates: PieceRate[];
    units: Option[];
}) {
    const { t } = useTrans();

    return (
        <>
            <Head title={t('Job rates')} />
            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title={t('Job rates')}
                    description={t(
                        'What contract workers are paid per kg, bag, ton or job. A new rate applies to work recorded from now on; work already recorded keeps its rate.',
                    )}
                />

                {rates.length > 0 && (
                    <div className="max-w-5xl rounded-xl border">
                        {rates.map((r) => (
                            <RateForm
                                key={`${r.id}-${r.updated_at ?? ''}`}
                                rate={r}
                                units={units}
                            />
                        ))}
                    </div>
                )}

                <div className="max-w-5xl">
                    <h2 className="mb-2 text-sm font-medium">{t('New job')}</h2>
                    <div className="rounded-xl border border-dashed">
                        <RateForm units={units} />
                    </div>
                </div>
            </div>
        </>
    );
}

PieceRates.layout = {
    breadcrumbs: [{ title: 'Job rates', href: index() }],
};

import { Form, Head } from '@inertiajs/react';
import VehicleController from '@/actions/App/Http/Controllers/VehicleController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { NativeSelect } from '@/components/native-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFormat } from '@/hooks/use-format';
import { useTrans } from '@/hooks/use-trans';
import { index } from '@/routes/vehicles';
import type { Vehicle } from '@/types';

type VehicleRow = Vehicle & { leaf_kg: string; cost: string };

function VehicleForm({ vehicle }: { vehicle?: VehicleRow }) {
    const { t } = useTrans();
    const f = useFormat();
    const form = vehicle
        ? VehicleController.update.form(vehicle.id)
        : VehicleController.store.form();

    return (
        <Form
            {...form}
            options={{ preserveScroll: true }}
            resetOnSuccess={!vehicle}
            className="grid items-start gap-2 border-b p-3 last:border-b-0 sm:grid-cols-[1fr_9rem_1fr_9rem_7rem_auto]"
        >
            {({ processing, errors, isDirty }) => (
                <>
                    <div>
                        <Input
                            name="name"
                            defaultValue={vehicle?.name}
                            placeholder={t('Vehicle name, e.g. Pickup 1')}
                            aria-label={t('Vehicle name')}
                            required
                            className="font-medium"
                        />
                        {vehicle && (
                            <p className="mt-1 text-xs text-muted-foreground">
                                {t('This month: :kg leaf, :cost spent', {
                                    kg: f.kg(vehicle.leaf_kg),
                                    cost: f.money(vehicle.cost),
                                })}
                            </p>
                        )}
                        <InputError message={errors.name} />
                    </div>
                    <div>
                        <Input
                            name="registration_no"
                            defaultValue={vehicle?.registration_no ?? ''}
                            placeholder={t('Registration no.')}
                            aria-label={t('Registration no.')}
                        />
                        <InputError message={errors.registration_no} />
                    </div>
                    <div>
                        <Input
                            name="driver_name"
                            defaultValue={vehicle?.driver_name ?? ''}
                            placeholder={t('Driver')}
                            aria-label={t('Driver')}
                        />
                        <InputError message={errors.driver_name} />
                    </div>
                    <div>
                        <Input
                            name="driver_phone"
                            type="tel"
                            defaultValue={vehicle?.driver_phone ?? ''}
                            placeholder={t('Driver phone')}
                            aria-label={t('Driver phone')}
                        />
                        <InputError message={errors.driver_phone} />
                    </div>
                    <NativeSelect
                        name="is_active"
                        defaultValue={vehicle && !vehicle.is_active ? '0' : '1'}
                        aria-label={t('Status')}
                    >
                        <option value="1">{t('Active')}</option>
                        <option value="0">{t('Inactive')}</option>
                    </NativeSelect>
                    <Button
                        variant={vehicle ? 'outline' : 'default'}
                        disabled={
                            processing || (vehicle !== undefined && !isDirty)
                        }
                    >
                        {vehicle ? t('Save') : t('Add vehicle')}
                    </Button>
                </>
            )}
        </Form>
    );
}

export default function Vehicles({ vehicles }: { vehicles: VehicleRow[] }) {
    const { t } = useTrans();

    return (
        <>
            <Head title={t('Vehicles')} />
            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title={t('Vehicles')}
                    description={t(
                        'The factory’s own vehicles that collect leaf from gardens. Their fuel, driver and repair costs are booked as vehicle expenses and added to the cost of leaf.',
                    )}
                />

                {vehicles.length > 0 && (
                    <div className="max-w-6xl rounded-xl border">
                        {vehicles.map((v) => (
                            <VehicleForm
                                key={`${v.id}-${v.updated_at ?? ''}`}
                                vehicle={v}
                            />
                        ))}
                    </div>
                )}

                <div className="max-w-6xl">
                    <h2 className="mb-2 text-sm font-medium">
                        {t('New vehicle')}
                    </h2>
                    <div className="rounded-xl border border-dashed">
                        <VehicleForm />
                    </div>
                </div>
            </div>
        </>
    );
}

Vehicles.layout = {
    breadcrumbs: [{ title: 'Vehicles', href: index() }],
};

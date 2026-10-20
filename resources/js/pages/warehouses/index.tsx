import { Form, Head } from '@inertiajs/react';
import WarehouseController from '@/actions/App/Http/Controllers/WarehouseController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { NativeSelect } from '@/components/native-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFormat } from '@/hooks/use-format';
import { useTrans } from '@/hooks/use-trans';
import { index } from '@/routes/warehouses';
import type { Warehouse } from '@/types';

type WarehouseRow = Warehouse & { waiting_kg: string; waiting_count: number };

function WarehouseForm({ warehouse }: { warehouse?: WarehouseRow }) {
    const { t } = useTrans();
    const f = useFormat();
    const form = warehouse
        ? WarehouseController.update.form(warehouse.id)
        : WarehouseController.store.form();

    return (
        <Form
            {...form}
            options={{ preserveScroll: true }}
            resetOnSuccess={!warehouse}
            className="grid items-start gap-2 border-b p-3 last:border-b-0 sm:grid-cols-[1fr_1fr_7rem_auto]"
        >
            {({ processing, errors, isDirty }) => (
                <>
                    <div>
                        <Input
                            name="name"
                            defaultValue={warehouse?.name}
                            placeholder={t('Warehouse name')}
                            aria-label={t('Warehouse name')}
                            required
                            className="font-medium"
                        />
                        {warehouse && warehouse.waiting_count > 0 && (
                            <p className="mt-1 text-xs text-muted-foreground">
                                {t(':count invoices waiting for sale, :kg', {
                                    count: f.number(warehouse.waiting_count),
                                    kg: f.kg(warehouse.waiting_kg),
                                })}
                            </p>
                        )}
                        <InputError message={errors.name} />
                    </div>
                    <div>
                        <Input
                            name="location"
                            defaultValue={warehouse?.location ?? ''}
                            placeholder={t('Location')}
                            aria-label={t('Location')}
                        />
                        <InputError message={errors.location} />
                    </div>
                    <NativeSelect
                        name="is_active"
                        defaultValue={
                            warehouse && !warehouse.is_active ? '0' : '1'
                        }
                        aria-label={t('Status')}
                    >
                        <option value="1">{t('Active')}</option>
                        <option value="0">{t('Inactive')}</option>
                    </NativeSelect>
                    <Button
                        variant={warehouse ? 'outline' : 'default'}
                        disabled={
                            processing || (warehouse !== undefined && !isDirty)
                        }
                    >
                        {warehouse ? t('Save') : t('Add warehouse')}
                    </Button>
                </>
            )}
        </Form>
    );
}

export default function Warehouses({
    warehouses,
}: {
    warehouses: WarehouseRow[];
}) {
    const { t } = useTrans();

    return (
        <>
            <Head title={t('Warehouses')} />
            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title={t('Warehouses')}
                    description={t(
                        'The auction warehouses the factory sends its invoices to.',
                    )}
                />

                {warehouses.length > 0 && (
                    <div className="max-w-4xl rounded-xl border">
                        {warehouses.map((w) => (
                            <WarehouseForm
                                key={`${w.id}-${w.updated_at ?? ''}`}
                                warehouse={w}
                            />
                        ))}
                    </div>
                )}

                <div className="max-w-4xl">
                    <h2 className="mb-2 text-sm font-medium">
                        {t('New warehouse')}
                    </h2>
                    <div className="rounded-xl border border-dashed">
                        <WarehouseForm />
                    </div>
                </div>
            </div>
        </>
    );
}

Warehouses.layout = {
    breadcrumbs: [{ title: 'Warehouses', href: index() }],
};

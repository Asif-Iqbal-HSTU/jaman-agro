import { Head } from '@inertiajs/react';
import SupplierController from '@/actions/App/Http/Controllers/SupplierController';
import Heading from '@/components/heading';
import { SupplierForm } from '@/components/suppliers/supplier-form';
import { useTrans } from '@/hooks/use-trans';
import { index } from '@/routes/suppliers';
import type { Supplier } from '@/types';

export default function EditSupplier({ supplier }: { supplier: Supplier }) {
    const { t } = useTrans();

    return (
        <>
            <Head title={t('Edit supplier')} />
            <div className="p-4 md:p-6">
                <Heading
                    title={t('Edit supplier')}
                    description={supplier.name}
                />
                <SupplierForm
                    form={SupplierController.update.form(supplier)}
                    supplier={supplier}
                />
            </div>
        </>
    );
}

EditSupplier.layout = {
    breadcrumbs: [{ title: 'Suppliers', href: index() }],
};

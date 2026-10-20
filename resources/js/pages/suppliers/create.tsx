import { Head } from '@inertiajs/react';
import SupplierController from '@/actions/App/Http/Controllers/SupplierController';
import Heading from '@/components/heading';
import { SupplierForm } from '@/components/suppliers/supplier-form';
import { useTrans } from '@/hooks/use-trans';
import { create, index } from '@/routes/suppliers';

export default function CreateSupplier() {
    const { t } = useTrans();

    return (
        <>
            <Head title={t('Add supplier')} />
            <div className="p-4 md:p-6">
                <Heading
                    title={t('Add supplier')}
                    description={t(
                        'A garden owner the factory buys green leaf from.',
                    )}
                />
                <SupplierForm form={SupplierController.store.form()} />
            </div>
        </>
    );
}

CreateSupplier.layout = {
    breadcrumbs: [
        { title: 'Suppliers', href: index() },
        { title: 'Add supplier', href: create() },
    ],
};

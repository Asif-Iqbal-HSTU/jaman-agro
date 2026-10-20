import { Head } from '@inertiajs/react';
import CustomerController from '@/actions/App/Http/Controllers/CustomerController';
import Heading from '@/components/heading';
import { CustomerForm } from '@/components/sales/customer-form';
import { useTrans } from '@/hooks/use-trans';
import { create, index } from '@/routes/customers';

export default function CreateCustomer() {
    const { t } = useTrans();

    return (
        <>
            <Head title={t('Add customer')} />
            <div className="p-4 md:p-6">
                <Heading
                    title={t('Add customer')}
                    description={t(
                        'A shop or buyer that takes tea from the factory.',
                    )}
                />
                <CustomerForm form={CustomerController.store.form()} />
            </div>
        </>
    );
}

CreateCustomer.layout = {
    breadcrumbs: [
        { title: 'Customers', href: index() },
        { title: 'Add customer', href: create() },
    ],
};

import { Head } from '@inertiajs/react';
import CustomerController from '@/actions/App/Http/Controllers/CustomerController';
import Heading from '@/components/heading';
import { CustomerForm } from '@/components/sales/customer-form';
import { useTrans } from '@/hooks/use-trans';
import { index } from '@/routes/customers';
import type { Customer } from '@/types';

export default function EditCustomer({ customer }: { customer: Customer }) {
    const { t } = useTrans();

    return (
        <>
            <Head title={t('Edit customer')} />
            <div className="p-4 md:p-6">
                <Heading
                    title={t('Edit customer')}
                    description={customer.name}
                />
                <CustomerForm
                    form={CustomerController.update.form(customer.id)}
                    customer={customer}
                />
            </div>
        </>
    );
}

EditCustomer.layout = {
    breadcrumbs: [{ title: 'Customers', href: index() }],
};

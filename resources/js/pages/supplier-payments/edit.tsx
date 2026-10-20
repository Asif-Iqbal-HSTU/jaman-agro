import { Head } from '@inertiajs/react';
import SupplierPaymentController from '@/actions/App/Http/Controllers/SupplierPaymentController';
import Heading from '@/components/heading';
import { PaymentForm } from '@/components/payments/payment-form';
import { useTrans } from '@/hooks/use-trans';
import { index } from '@/routes/supplier-payments';
import type { Option, SupplierPayment, SupplierSummary } from '@/types';

type Props = {
    payment: SupplierPayment;
    suppliers: SupplierSummary[];
    types: Option[];
    methods: Option[];
};

export default function EditPayment({ payment, ...props }: Props) {
    const { t } = useTrans();

    return (
        <>
            <Head title={t('Correct payment')} />
            <div className="p-4 md:p-6">
                <Heading title={t('Correct payment')} />
                <PaymentForm
                    form={SupplierPaymentController.update.form(payment.id)}
                    payment={payment}
                    {...props}
                />
            </div>
        </>
    );
}

EditPayment.layout = {
    breadcrumbs: [{ title: 'Supplier payments', href: index() }],
};

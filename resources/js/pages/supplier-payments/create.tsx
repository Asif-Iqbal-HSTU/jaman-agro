import { Head } from '@inertiajs/react';
import SupplierPaymentController from '@/actions/App/Http/Controllers/SupplierPaymentController';
import Heading from '@/components/heading';
import { PaymentForm } from '@/components/payments/payment-form';
import { Balance } from '@/components/suppliers/balance';
import { useTrans } from '@/hooks/use-trans';
import { create, index } from '@/routes/supplier-payments';
import type { Option, SupplierSummary } from '@/types';

type Props = {
    suppliers: SupplierSummary[];
    supplierId: number | null;
    balance: string | null;
    today: string;
    types: Option[];
    methods: Option[];
};

export default function CreatePayment({ balance, ...props }: Props) {
    const { t } = useTrans();

    return (
        <>
            <Head title={t('Record payment')} />
            <div className="p-4 md:p-6">
                <Heading
                    title={t('Record payment')}
                    description={t(
                        'Money paid to a supplier for leaf, or an advance against future leaf.',
                    )}
                />
                {balance !== null && (
                    <p className="mb-6 text-sm">
                        {t('Current balance')}:{' '}
                        <Balance
                            value={balance}
                            withLabel
                            className="font-semibold"
                        />
                    </p>
                )}
                <PaymentForm
                    form={SupplierPaymentController.store.form()}
                    {...props}
                />
            </div>
        </>
    );
}

CreatePayment.layout = {
    breadcrumbs: [
        { title: 'Supplier payments', href: index() },
        { title: 'Record payment', href: create() },
    ],
};

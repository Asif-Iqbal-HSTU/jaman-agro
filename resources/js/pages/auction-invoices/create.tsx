import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import { InvoiceForm } from '@/components/sales/invoice-form';
import { useTrans } from '@/hooks/use-trans';
import { create, index } from '@/routes/auction-invoices';
import type { Option, TeaGrade } from '@/types';

type Props = {
    grades: TeaGrade[];
    brokers: { id: number; name: string }[];
    warehouses: { id: number; name: string; location: string | null }[];
    balances: Record<string, string>;
    packageTypes: Option[];
    nextNumber: string;
    today: string;
};

export default function CreateInvoice(props: Props) {
    const { t } = useTrans();

    return (
        <>
            <Head title={t('Pack invoice')} />
            <div className="p-4 md:p-6">
                <Heading
                    title={t('Pack invoice')}
                    description={t('Packages of one grade going to auction.')}
                />
                <InvoiceForm {...props} />
            </div>
        </>
    );
}

CreateInvoice.layout = {
    breadcrumbs: [
        { title: 'Auction invoices', href: index() },
        { title: 'Pack invoice', href: create() },
    ],
};

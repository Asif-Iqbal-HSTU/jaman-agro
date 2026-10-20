import { Head } from '@inertiajs/react';
import type { ComponentProps } from 'react';
import Heading from '@/components/heading';
import { ReceiptForm } from '@/components/leaf/receipt-form';
import { useTrans } from '@/hooks/use-trans';
import { create, index } from '@/routes/leaf-receipts';

type Props = Omit<ComponentProps<typeof ReceiptForm>, 'receipt'> & {
    date: string;
    supplierId: number | null;
};

export default function CreateReceipt(props: Props) {
    const { t } = useTrans();

    return (
        <>
            <Head title={t('Record delivery')} />
            <div className="p-4 md:p-6">
                <Heading
                    title={t('Record delivery')}
                    description={t(
                        'Weigh the leaf, measure the moisture and enter the figures.',
                    )}
                />
                <ReceiptForm {...props} />
            </div>
        </>
    );
}

CreateReceipt.layout = {
    breadcrumbs: [
        { title: 'Leaf intake', href: index() },
        { title: 'Record delivery', href: create() },
    ],
};

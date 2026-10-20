import { Head } from '@inertiajs/react';
import type { ComponentProps } from 'react';
import { EditedBadge } from '@/components/edited-badge';
import Heading from '@/components/heading';
import { ReceiptForm } from '@/components/leaf/receipt-form';
import { useTrans } from '@/hooks/use-trans';
import { index } from '@/routes/leaf-receipts';
import type { LeafReceipt } from '@/types';

type Props = ComponentProps<typeof ReceiptForm> & { receipt: LeafReceipt };

export default function EditReceipt(props: Props) {
    const { t } = useTrans();

    return (
        <>
            <Head title={t('Correct delivery')} />
            <div className="p-4 md:p-6">
                <div className="flex items-start gap-2">
                    <Heading
                        title={t('Correct delivery')}
                        description={props.receipt.number}
                    />
                    <EditedBadge at={props.receipt.edited_at} />
                </div>
                <ReceiptForm {...props} />
            </div>
        </>
    );
}

EditReceipt.layout = {
    breadcrumbs: [{ title: 'Leaf intake', href: index() }],
};

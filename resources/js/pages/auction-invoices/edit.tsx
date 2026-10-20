import { Head, router } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import { EditedBadge } from '@/components/edited-badge';
import Heading from '@/components/heading';
import { RecordActions } from '@/components/record-actions';
import { InvoiceForm } from '@/components/sales/invoice-form';
import { InvoiceStatus } from '@/components/sales/invoice-status';
import { Button } from '@/components/ui/button';
import { useTrans } from '@/hooks/use-trans';
import { destroy, index } from '@/routes/auction-invoices';
import type { AuctionInvoice, Option, TeaGrade } from '@/types';

type Props = {
    invoice: AuctionInvoice;
    grades: TeaGrade[];
    brokers: { id: number; name: string }[];
    warehouses: { id: number; name: string; location: string | null }[];
    balances: Record<string, string>;
    packageTypes: Option[];
    today: string;
};

export default function EditInvoice(props: Props) {
    const { t } = useTrans();
    const { invoice } = props;

    const remove = () => {
        if (
            window.confirm(
                t('Delete invoice :number? Its tea goes back into stock.', {
                    number: invoice.invoice_no,
                }),
            )
        ) {
            router.delete(destroy(invoice.id));
        }
    };

    return (
        <>
            <Head title={invoice.invoice_no} />
            <div className="p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title={t('Invoice :number', {
                            number: invoice.invoice_no,
                        })}
                        description={t(
                            'Fill in dispatch, the auction result and payment as they happen.',
                        )}
                    />
                    <div className="flex items-center gap-3">
                        <InvoiceStatus status={invoice.status} />
                        <EditedBadge at={invoice.edited_at} />
                        {invoice.price_per_kg === null &&
                            (invoice.edit_lock === 'locked' ||
                            invoice.edit_lock === 'pending' ? (
                                <RecordActions
                                    lock={invoice.edit_lock}
                                    subject="auction_invoice"
                                    id={invoice.id}
                                />
                            ) : (
                                <Button variant="ghost" onClick={remove}>
                                    <Trash2 className="text-destructive" />{' '}
                                    {t('Delete')}
                                </Button>
                            ))}
                    </div>
                </div>
                {(invoice.edit_lock === 'locked' ||
                    invoice.edit_lock === 'pending') && (
                    <p className="mb-6 max-w-2xl rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                        {t(
                            'The packing details are locked. You can still fill in dispatch, the auction result and the payment. To correct the packing, ask the administrator to unlock it.',
                        )}
                    </p>
                )}
                <InvoiceForm {...props} />
            </div>
        </>
    );
}

EditInvoice.layout = {
    breadcrumbs: [{ title: 'Auction invoices', href: index() }],
};

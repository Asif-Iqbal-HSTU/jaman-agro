import { Head, Link, router } from '@inertiajs/react';
import { Leaf, Plus, Printer, Trash2 } from 'lucide-react';
import { RecordActions } from '@/components/record-actions';
import { Button } from '@/components/ui/button';
import { useCanManage } from '@/hooks/use-can-manage';
import { useFormat } from '@/hooks/use-format';
import { useTrans } from '@/hooks/use-trans';
import { show as showCustomer } from '@/routes/customers';
import { create, destroy, index } from '@/routes/retail-sales';
import type { RetailSale } from '@/types';

export default function RetailSaleMemo({ sale }: { sale: RetailSale }) {
    const { t } = useTrans();
    const f = useFormat();
    const canManage = useCanManage();
    const paid = Number(sale.payment?.amount ?? 0);
    const due = Number(sale.total_amount) - paid;

    const cancel = () => {
        if (
            window.confirm(
                t(
                    'Cancel sale :number? The tea goes back into stock and the money taken with it is removed.',
                    { number: sale.number },
                ),
            )
        ) {
            router.delete(destroy(sale.id));
        }
    };

    return (
        <>
            <Head title={sale.number} />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-wrap gap-2 print:hidden">
                    <Button onClick={() => window.print()}>
                        <Printer /> {t('Print memo')}
                    </Button>
                    {canManage && (
                        <Button variant="outline" asChild>
                            <Link
                                href={create({
                                    query: {
                                        customer: sale.customer_id ?? undefined,
                                    },
                                })}
                            >
                                <Plus /> {t('New sale')}
                            </Link>
                        </Button>
                    )}
                    {sale.customer && (
                        <Button variant="ghost" asChild>
                            <Link href={showCustomer(sale.customer.id)}>
                                {t('Customer statement')}
                            </Link>
                        </Button>
                    )}
                    {canManage &&
                        (sale.edit_lock === 'locked' ||
                        sale.edit_lock === 'pending' ? (
                            <span className="ml-auto">
                                <RecordActions
                                    lock={sale.edit_lock}
                                    subject="retail_sale"
                                    id={sale.id}
                                />
                            </span>
                        ) : (
                            <Button
                                variant="ghost"
                                className="ml-auto"
                                onClick={cancel}
                            >
                                <Trash2 className="text-destructive" />{' '}
                                {t('Cancel sale')}
                            </Button>
                        ))}
                </div>

                <article className="mx-auto max-w-lg rounded-xl border bg-card p-6 print:max-w-none print:border-0 print:p-0">
                    <header className="flex items-center gap-3 border-b pb-4">
                        <span className="flex size-10 items-center justify-center rounded-full bg-[#1f4a2b] text-[#e8d7a6] print:border print:bg-transparent print:text-black">
                            <Leaf className="size-5" />
                        </span>
                        <div>
                            <p className="font-serif text-lg font-semibold">
                                {t('Jaman Agro')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {t('Sale memo')}
                            </p>
                        </div>
                        <p className="ml-auto text-right font-mono text-sm">
                            {sale.number}
                            <span className="block font-sans text-xs text-muted-foreground">
                                {f.date(sale.sold_on)}
                            </span>
                        </p>
                    </header>

                    <div className="border-b py-4 text-sm">
                        <p className="font-medium">
                            {sale.customer?.name ?? t('Walk-in customer')}
                        </p>
                        {sale.customer && (
                            <p className="text-muted-foreground">
                                {[sale.customer.phone, sale.customer.address]
                                    .filter(Boolean)
                                    .join(' · ')}
                            </p>
                        )}
                    </div>

                    <table className="my-4 w-full text-sm">
                        <thead className="text-left text-xs text-muted-foreground">
                            <tr>
                                <th className="py-1 font-medium">
                                    {t('Grade')}
                                </th>
                                <th className="py-1 text-right font-medium">
                                    {t('kg')}
                                </th>
                                <th className="py-1 text-right font-medium">
                                    {t('Rate')}
                                </th>
                                <th className="py-1 text-right font-medium">
                                    {t('Amount')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sale.items.map((item) => (
                                <tr key={item.id}>
                                    <td className="py-1 font-medium">
                                        {item.grade?.code}
                                    </td>
                                    <td className="py-1 text-right tabular-nums">
                                        {f.decimal(item.kg)}
                                    </td>
                                    <td className="py-1 text-right tabular-nums">
                                        {f.money(item.rate)}
                                    </td>
                                    <td className="py-1 text-right tabular-nums">
                                        {f.money(item.amount)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <dl className="space-y-2 border-t pt-3 text-sm">
                        <div className="flex justify-between text-base font-semibold">
                            <dt>{t('Total')}</dt>
                            <dd className="tabular-nums">
                                {f.money(sale.total_amount)}
                            </dd>
                        </div>
                        <div className="flex justify-between">
                            <dt>{t('Received')}</dt>
                            <dd className="tabular-nums">{f.money(paid)}</dd>
                        </div>
                        {due > 0 && (
                            <div className="flex justify-between font-semibold">
                                <dt>{t('Due')}</dt>
                                <dd className="tabular-nums">{f.money(due)}</dd>
                            </div>
                        )}
                    </dl>

                    {sale.notes && (
                        <p className="mt-3 border-t pt-3 text-sm text-muted-foreground">
                            {sale.notes}
                        </p>
                    )}

                    <footer className="mt-8 flex justify-between gap-6 text-xs text-muted-foreground">
                        <p>
                            {t('Recorded by :name', {
                                name: sale.recorder?.name ?? '—',
                            })}
                        </p>
                        <p className="border-t border-dashed pt-1">
                            {t('Customer signature')}
                        </p>
                    </footer>
                </article>
            </div>
        </>
    );
}

RetailSaleMemo.layout = {
    breadcrumbs: [{ title: 'Retail sales', href: index() }],
};

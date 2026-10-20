import { Form, Head, Link, router } from '@inertiajs/react';
import { Banknote, Pencil, Printer, ShoppingBag } from 'lucide-react';
import { RecordActions } from '@/components/record-actions';
import { Balance } from '@/components/suppliers/balance';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCanManage } from '@/hooks/use-can-manage';
import { useFormat } from '@/hooks/use-format';
import { useTrans } from '@/hooks/use-trans';
import {
    create as newPayment,
    destroy as destroyPayment,
} from '@/routes/customer-payments';
import { edit, index, show } from '@/routes/customers';
import { create as newSale, show as showSale } from '@/routes/retail-sales';
import type { Customer, EditLockState } from '@/types';

type Entry = {
    kind: 'sale' | 'payment';
    id: number;
    edit_lock?: EditLockState;
    date: string;
    reference: string | null;
    details: string;
    debit: string | null;
    credit: string | null;
    balance: string;
};

type Props = {
    customer: Customer & { balance: string };
    statement: {
        opening_balance: string;
        closing_balance: string;
        totals: { sales: string; paid: string };
        entries: Entry[];
    };
    filters: { from: string; to: string };
};

export default function CustomerStatement({
    customer,
    statement,
    filters,
}: Props) {
    const { t } = useTrans();
    const f = useFormat();
    const canManage = useCanManage();

    const removePayment = (id: number) => {
        if (window.confirm(t('Delete this payment? This cannot be undone.'))) {
            router.delete(destroyPayment(id), { preserveScroll: true });
        }
    };

    return (
        <>
            <Head title={customer.name} />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">
                            {t('Jaman Agro')} · {t('Customer statement')}
                        </p>
                        <h1 className="mt-1 text-2xl font-semibold">
                            {customer.name}
                            {!customer.is_active && (
                                <Badge variant="outline" className="ml-2">
                                    {t('Inactive')}
                                </Badge>
                            )}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {[customer.phone, customer.address]
                                .filter(Boolean)
                                .join(' · ')}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 print:hidden">
                        {canManage && (
                            <>
                                <Button asChild>
                                    <Link
                                        href={newSale({
                                            query: { customer: customer.id },
                                        })}
                                    >
                                        <ShoppingBag /> {t('New sale')}
                                    </Link>
                                </Button>
                                <Button variant="outline" asChild>
                                    <Link
                                        href={newPayment({
                                            query: { customer: customer.id },
                                        })}
                                    >
                                        <Banknote /> {t('Receive payment')}
                                    </Link>
                                </Button>
                                <Button variant="ghost" asChild>
                                    <Link href={edit(customer.id)}>
                                        <Pencil /> {t('Edit')}
                                    </Link>
                                </Button>
                            </>
                        )}
                        <Button variant="ghost" onClick={() => window.print()}>
                            <Printer /> {t('Print')}
                        </Button>
                    </div>
                </div>

                <div className="rounded-xl border bg-muted/30 p-4 print:hidden">
                    <p className="text-xs text-muted-foreground">
                        {t('Current balance')}
                    </p>
                    <p className="mt-1 text-2xl font-semibold">
                        <Balance
                            value={customer.balance}
                            withLabel
                            positiveLabel="due"
                        />
                    </p>
                </div>

                <Form
                    {...show.form(customer.id)}
                    options={{ preserveScroll: true }}
                    className="flex flex-wrap items-end gap-3 print:hidden"
                >
                    <div className="grid gap-1">
                        <Label htmlFor="from">{t('From')}</Label>
                        <Input
                            id="from"
                            name="from"
                            type="date"
                            defaultValue={filters.from}
                        />
                    </div>
                    <div className="grid gap-1">
                        <Label htmlFor="to">{t('To')}</Label>
                        <Input
                            id="to"
                            name="to"
                            type="date"
                            defaultValue={filters.to}
                        />
                    </div>
                    <Button type="submit" variant="outline">
                        {t('Show')}
                    </Button>
                </Form>

                <p className="text-sm font-medium">
                    {t('Statement from :from to :to', {
                        from: f.date(filters.from),
                        to: f.date(filters.to),
                    })}
                </p>

                <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left text-xs text-muted-foreground uppercase">
                            <tr>
                                <th className="px-4 py-3 font-medium">
                                    {t('Date')}
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    {t('Details')}
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    {t('Sale')}
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    {t('Received')}
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    {t('Balance')}
                                </th>
                                {canManage && (
                                    <th className="px-2 py-3 print:hidden" />
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            <tr className="bg-muted/20">
                                <td className="px-4 py-2" />
                                <td className="px-4 py-2 font-medium">
                                    {t('Opening balance')}
                                </td>
                                <td />
                                <td />
                                <td className="px-4 py-2 text-right font-medium">
                                    <Balance
                                        value={statement.opening_balance}
                                    />
                                </td>
                                {canManage && <td className="print:hidden" />}
                            </tr>
                            {statement.entries.map((e) => (
                                <tr key={`${e.kind}-${e.id}`}>
                                    <td className="px-4 py-2 whitespace-nowrap">
                                        {f.date(e.date)}
                                    </td>
                                    <td className="px-4 py-2">
                                        {e.kind === 'sale' ? (
                                            <>
                                                <Link
                                                    href={showSale(e.id)}
                                                    className="font-mono text-xs hover:underline"
                                                >
                                                    {e.reference}
                                                </Link>{' '}
                                                <span className="text-muted-foreground">
                                                    {e.details}
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                {t('Payment')} · {e.details}
                                                {e.reference && (
                                                    <span className="ml-2 text-xs text-muted-foreground">
                                                        {e.reference}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </td>
                                    <td className="px-4 py-2 text-right tabular-nums">
                                        {e.debit ? f.money(e.debit) : ''}
                                    </td>
                                    <td className="px-4 py-2 text-right tabular-nums">
                                        {e.credit ? f.money(e.credit) : ''}
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                        <Balance value={e.balance} />
                                    </td>
                                    {canManage && (
                                        <td className="px-2 py-1 text-right print:hidden">
                                            {e.kind === 'payment' && (
                                                <RecordActions
                                                    lock={e.edit_lock}
                                                    subject="customer_payment"
                                                    id={e.id}
                                                    onDelete={() =>
                                                        removePayment(e.id)
                                                    }
                                                />
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {statement.entries.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-8 text-center text-muted-foreground"
                                    >
                                        {t(
                                            'No sales or payments in this period.',
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot className="border-t-2 font-semibold">
                            <tr>
                                <td className="px-4 py-3" />
                                <td className="px-4 py-3">
                                    {t('Closing balance')}
                                </td>
                                <td className="px-4 py-3 text-right tabular-nums">
                                    {f.money(statement.totals.sales)}
                                </td>
                                <td className="px-4 py-3 text-right tabular-nums">
                                    {f.money(statement.totals.paid)}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <Balance
                                        value={statement.closing_balance}
                                    />
                                </td>
                                {canManage && <td className="print:hidden" />}
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </>
    );
}

CustomerStatement.layout = {
    breadcrumbs: [{ title: 'Customers', href: index() }],
};

import { Form, Head, Link } from '@inertiajs/react';
import { Banknote, Leaf, Pencil, Printer } from 'lucide-react';
import { Balance } from '@/components/suppliers/balance';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCanManage } from '@/hooks/use-can-manage';
import { useFormat } from '@/hooks/use-format';
import { useTrans } from '@/hooks/use-trans';
import {
    create as newReceipt,
    show as showReceipt,
} from '@/routes/leaf-receipts';
import { create as newPayment } from '@/routes/supplier-payments';
import { edit, index, show } from '@/routes/suppliers';
import type { Supplier } from '@/types';

type Entry = {
    kind: 'leaf' | 'advance' | 'payment';
    id: number;
    date: string;
    reference: string | null;
    method?: string;
    net_kg: string | null;
    rate: string | null;
    credit: string | null;
    debit: string | null;
    balance: string;
};

type Props = {
    supplier: Supplier & { balance: string };
    statement: {
        opening_balance: string;
        closing_balance: string;
        totals: {
            net_kg: string;
            leaf_amount: string;
            paid: string;
            unpriced: number;
        };
        entries: Entry[];
    };
    filters: { from: string; to: string };
};

export default function SupplierStatement({
    supplier,
    statement,
    filters,
}: Props) {
    const { t } = useTrans();
    const f = useFormat();
    const canManage = useCanManage();

    const describe = (e: Entry) => {
        if (e.kind === 'leaf') {
            return e.rate
                ? t('Green leaf :kg @ :rate', {
                      kg: f.kg(e.net_kg),
                      rate: f.money(e.rate),
                  })
                : t('Green leaf :kg (rate pending)', { kg: f.kg(e.net_kg) });
        }

        return `${e.kind === 'advance' ? t('Advance') : t('Payment')} · ${e.method ?? ''}`;
    };

    return (
        <>
            <Head title={supplier.name} />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground print:text-black">
                            {t('Jaman Agro')} · {t('Supplier statement')}
                        </p>
                        <h1 className="mt-1 text-2xl font-semibold">
                            {supplier.name}
                            {supplier.code && (
                                <span className="ml-2 text-base font-normal text-muted-foreground">
                                    {supplier.code}
                                </span>
                            )}
                            {!supplier.is_active && (
                                <Badge variant="outline" className="ml-2">
                                    {t('Inactive')}
                                </Badge>
                            )}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {[
                                supplier.garden_name,
                                supplier.phone,
                                supplier.address,
                            ]
                                .filter(Boolean)
                                .join(' · ')}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 print:hidden">
                        {canManage && (
                            <>
                                <Button asChild>
                                    <Link
                                        href={newReceipt({
                                            query: { supplier: supplier.id },
                                        })}
                                    >
                                        <Leaf /> {t('Record delivery')}
                                    </Link>
                                </Button>
                                <Button variant="outline" asChild>
                                    <Link
                                        href={newPayment({
                                            query: { supplier: supplier.id },
                                        })}
                                    >
                                        <Banknote /> {t('Record payment')}
                                    </Link>
                                </Button>
                                <Button variant="ghost" asChild>
                                    <Link href={edit(supplier.id)}>
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
                        <Balance value={supplier.balance} withLabel />
                    </p>
                </div>

                <Form
                    {...show.form(supplier.id)}
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
                                    {t('Leaf value')}
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    {t('Paid')}
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    {t('Balance')}
                                </th>
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
                            </tr>
                            {statement.entries.map((e) => (
                                <tr key={`${e.kind}-${e.id}`}>
                                    <td className="px-4 py-2 whitespace-nowrap">
                                        {f.date(e.date)}
                                    </td>
                                    <td className="px-4 py-2">
                                        {describe(e)}
                                        {e.reference && (
                                            <span className="ml-2 text-xs text-muted-foreground">
                                                {e.kind === 'leaf' ? (
                                                    <Link
                                                        href={showReceipt(e.id)}
                                                        className="hover:underline"
                                                    >
                                                        {e.reference}
                                                    </Link>
                                                ) : (
                                                    e.reference
                                                )}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-2 text-right tabular-nums">
                                        {e.kind === 'leaf'
                                            ? e.credit
                                                ? f.money(e.credit)
                                                : '—'
                                            : ''}
                                    </td>
                                    <td className="px-4 py-2 text-right tabular-nums">
                                        {e.debit ? f.money(e.debit) : ''}
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                        <Balance value={e.balance} />
                                    </td>
                                </tr>
                            ))}
                            {statement.entries.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-4 py-8 text-center text-muted-foreground"
                                    >
                                        {t(
                                            'No deliveries or payments in this period.',
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
                                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                                        {t('Net leaf :kg', {
                                            kg: f.kg(statement.totals.net_kg),
                                        })}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right tabular-nums">
                                    {f.money(statement.totals.leaf_amount)}
                                </td>
                                <td className="px-4 py-3 text-right tabular-nums">
                                    {f.money(statement.totals.paid)}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <Balance
                                        value={statement.closing_balance}
                                    />
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {statement.totals.unpriced > 0 && (
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                        {t(
                            'Deliveries in this period still waiting for a rate: :count. They are not counted in the balance until the rate is set.',
                            { count: statement.totals.unpriced },
                        )}
                    </p>
                )}
            </div>
        </>
    );
}

SupplierStatement.layout = {
    breadcrumbs: [{ title: 'Suppliers', href: index() }],
};

import { Form, Head, Link } from '@inertiajs/react';
import { Plus, Search } from 'lucide-react';
import Heading from '@/components/heading';
import { Pagination } from '@/components/pagination';
import { InvoiceStatus, statusLabels } from '@/components/sales/invoice-status';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCanManage } from '@/hooks/use-can-manage';
import { useFormat } from '@/hooks/use-format';
import { useTrans } from '@/hooks/use-trans';
import { cn } from '@/lib/utils';
import { create, edit, index } from '@/routes/auction-invoices';
import type {
    AuctionInvoice,
    InvoiceStatus as Status,
    Paginated,
} from '@/types';

type Props = {
    invoices: Paginated<AuctionInvoice>;
    filters: { status: Status | null; search: string };
    summary: {
        awaiting_sale_kg: string;
        awaiting_sale_count: number;
        awaiting_payment: string;
        sold_this_month_kg: string;
        sold_this_month_amount: string;
    };
};

const statuses: Status[] = ['packed', 'dispatched', 'sold', 'paid'];

export default function AuctionInvoices({ invoices, filters, summary }: Props) {
    const { t } = useTrans();
    const f = useFormat();
    const canManage = useCanManage();

    return (
        <>
            <Head title={t('Auction invoices')} />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title={t('Auction invoices')}
                        description={t(
                            'Tea packed for auction, from the warehouse to the money in the bank.',
                        )}
                    />
                    {canManage && (
                        <Button asChild>
                            <Link href={create()}>
                                <Plus /> {t('Pack invoice')}
                            </Link>
                        </Button>
                    )}
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">
                            {t('Waiting to be sold')}
                        </p>
                        <p className="mt-1 text-xl font-semibold tabular-nums">
                            {f.kg(summary.awaiting_sale_kg)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {t(':count invoices', {
                                count: f.number(summary.awaiting_sale_count),
                            })}
                        </p>
                    </div>
                    <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">
                            {t('Sold, money still due')}
                        </p>
                        <p className="mt-1 text-xl font-semibold text-amber-700 tabular-nums dark:text-amber-400">
                            {f.money(summary.awaiting_payment)}
                        </p>
                    </div>
                    <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">
                            {t('Sold this month')}
                        </p>
                        <p className="mt-1 text-xl font-semibold tabular-nums">
                            {f.money(summary.sold_this_month_amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {f.kg(summary.sold_this_month_kg)}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-1">
                        {[null, ...statuses].map((s) => (
                            <Link
                                key={s ?? 'all'}
                                href={index({
                                    query: {
                                        status: s ?? undefined,
                                        search: filters.search || undefined,
                                    },
                                })}
                                preserveScroll
                                className={cn(
                                    'rounded-full border px-3 py-1 text-sm',
                                    filters.status === s
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'hover:bg-muted',
                                )}
                            >
                                {s ? t(statusLabels[s]) : t('All')}
                            </Link>
                        ))}
                    </div>
                    <Form
                        {...index.form()}
                        options={{ preserveState: true }}
                        className="flex gap-2"
                    >
                        {filters.status && (
                            <input
                                type="hidden"
                                name="status"
                                value={filters.status}
                            />
                        )}
                        <Input
                            name="search"
                            defaultValue={filters.search}
                            placeholder={t('Invoice, sale, lot or buyer')}
                            className="w-56"
                        />
                        <Button
                            type="submit"
                            variant="outline"
                            size="icon"
                            aria-label={t('Search')}
                        >
                            <Search />
                        </Button>
                    </Form>
                </div>

                <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left text-xs text-muted-foreground uppercase">
                            <tr>
                                <th className="px-4 py-3 font-medium">
                                    {t('Invoice')}
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    {t('Grade')}
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    {t('Packages')}
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    {t('Net')}
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    {t('Broker / warehouse / sale')}
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    {t('Price')}
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    {t('Net proceeds')}
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    {t('Status')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {invoices.data.map((i) => (
                                <tr key={i.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {canManage ? (
                                            <Link
                                                href={edit(i.id)}
                                                className="font-mono font-medium hover:underline"
                                            >
                                                {i.invoice_no}
                                            </Link>
                                        ) : (
                                            <span className="font-mono font-medium">
                                                {i.invoice_no}
                                            </span>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            {f.date(i.packed_on)}
                                        </p>
                                    </td>
                                    <td className="px-4 py-3 font-medium">
                                        {i.grade?.code}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {f.number(i.packages)} ×{' '}
                                        {f.decimal(i.kg_per_package)}
                                        <p className="text-xs text-muted-foreground">
                                            {i.package_type === 'chest'
                                                ? t('Chest')
                                                : t('Bag')}
                                        </p>
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                                        {f.kg(i.net_kg)}
                                    </td>
                                    <td className="px-4 py-3">
                                        {i.broker?.name ?? '—'}
                                        {i.warehouse && (
                                            <p className="text-xs text-muted-foreground">
                                                {i.warehouse.name}
                                            </p>
                                        )}
                                        {(i.sale_no || i.lot_no) && (
                                            <p className="text-xs text-muted-foreground">
                                                {[
                                                    i.sale_no &&
                                                        `${t('Sale')} ${i.sale_no}`,
                                                    i.lot_no &&
                                                        `${t('Lot')} ${i.lot_no}`,
                                                ]
                                                    .filter(Boolean)
                                                    .join(' · ')}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {i.price_per_kg
                                            ? f.money(i.price_per_kg)
                                            : '—'}
                                        {i.buyer && (
                                            <p className="text-xs text-muted-foreground">
                                                {i.buyer}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {i.net_amount
                                            ? f.money(i.net_amount)
                                            : '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <InvoiceStatus status={i.status} />
                                    </td>
                                </tr>
                            ))}
                            {invoices.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="px-4 py-10 text-center text-muted-foreground"
                                    >
                                        {t('No invoices found.')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination page={invoices} />
            </div>
        </>
    );
}

AuctionInvoices.layout = {
    breadcrumbs: [{ title: 'Auction invoices', href: index() }],
};

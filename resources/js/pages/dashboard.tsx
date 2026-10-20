import { Head, Link, usePage } from '@inertiajs/react';
import { Banknote, Leaf, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCanManage } from '@/hooks/use-can-manage';
import { useFormat } from '@/hooks/use-format';
import { useTrans } from '@/hooks/use-trans';
import { dashboard } from '@/routes';
import { index as auctionInvoices } from '@/routes/auction-invoices';
import { create as newReceipt, index as intake } from '@/routes/leaf-receipts';
import { index as productionIndex } from '@/routes/production';
import { create as newPayment } from '@/routes/supplier-payments';
import { index as suppliers } from '@/routes/suppliers';

type Props = {
    today: {
        date: string;
        deliveries: number;
        suppliers: number;
        net_kg: string;
        amount: string;
        rate: string | null;
    };
    week: { date: string; net_kg: string; amount: string }[];
    balances: { payable: string; advances: string };
    supplierCount: number;
    production: {
        green_leaf_kg: string;
        made_tea_kg: string;
        recovery: string | null;
    };
    stockKg: string;
    sales: {
        auction_kg: string;
        auction_amount: string;
        retail_amount: string;
        auction_due: string;
        customers_due: string;
    };
};

const roleLabels = {
    admin: 'Admin',
    manager: 'Manager',
    owner: 'Owner',
} as const;

function Stat({
    label,
    value,
    hint,
}: {
    label: string;
    value: string;
    hint?: string;
}) {
    return (
        <div className="rounded-xl border p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
    );
}

export default function Dashboard({
    today,
    week,
    balances,
    supplierCount,
    production,
    stockKg,
    sales,
}: Props) {
    const { auth } = usePage().props;
    const { t } = useTrans();
    const f = useFormat();
    const canManage = useCanManage();
    const weekKg = week.reduce((sum, d) => sum + Number(d.net_kg), 0);
    const weekAmount = week.reduce((sum, d) => sum + Number(d.amount), 0);

    return (
        <>
            <Head title={t('Dashboard')} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <section className="flex flex-wrap items-end justify-between gap-4 rounded-2xl bg-[#1f4a2b] p-6 text-[#eef3ea] dark:bg-[#132017]">
                    <div>
                        <Badge className="bg-[#e8d7a6] text-[#1b2a1f]">
                            {t(roleLabels[auth.user.role])}
                        </Badge>
                        <h1 className="mt-3 font-serif text-2xl font-semibold md:text-3xl">
                            {t('Welcome, :name', { name: auth.user.name })}
                        </h1>
                        <p className="mt-1 text-sm text-[#c3d3c0]">
                            {f.longDate(today.date)}
                        </p>
                    </div>
                    {canManage && (
                        <div className="flex flex-wrap gap-2">
                            <Button
                                asChild
                                className="bg-[#e8d7a6] text-[#1b2a1f] hover:bg-[#f1e3bb]"
                            >
                                <Link href={newReceipt()}>
                                    <Plus /> {t('Record delivery')}
                                </Link>
                            </Button>
                            <Button
                                asChild
                                variant="outline"
                                className="border-[#e8d7a6]/50 bg-transparent text-[#eef3ea] hover:bg-white/10 hover:text-white"
                            >
                                <Link href={newPayment()}>
                                    <Banknote /> {t('Record payment')}
                                </Link>
                            </Button>
                        </div>
                    )}
                </section>

                <section>
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-sm font-medium text-muted-foreground">
                            {t('Today')}
                        </h2>
                        <Link
                            href={intake()}
                            className="text-sm text-primary hover:underline"
                        >
                            {t('Open leaf intake')}
                        </Link>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Stat
                            label={t('Net leaf received')}
                            value={f.kg(today.net_kg)}
                            hint={t(
                                ':deliveries deliveries from :suppliers suppliers',
                                {
                                    deliveries: f.number(today.deliveries),
                                    suppliers: f.number(today.suppliers),
                                },
                            )}
                        />
                        <Stat
                            label={t('Leaf rate')}
                            value={
                                today.rate
                                    ? `${f.money(today.rate)} / kg`
                                    : t('Not set yet')
                            }
                        />
                        <Stat
                            label={t('Leaf value')}
                            value={f.money(today.amount)}
                            hint={
                                today.rate
                                    ? undefined
                                    : t('Set the rate to price today’s leaf.')
                            }
                        />
                        <Stat
                            label={t('Active suppliers')}
                            value={f.number(supplierCount)}
                        />
                    </div>
                </section>

                <section>
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-sm font-medium text-muted-foreground">
                            {t('Production this month')}
                        </h2>
                        <Link
                            href={productionIndex()}
                            className="text-sm text-primary hover:underline"
                        >
                            {t('Open production')}
                        </Link>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Stat
                            label={t('Made tea')}
                            value={f.kg(production.made_tea_kg)}
                        />
                        <Stat
                            label={t('Recovery')}
                            value={
                                production.recovery === null
                                    ? '—'
                                    : `${f.decimal(production.recovery)}%`
                            }
                        />
                        <Stat
                            label={t('Green leaf used')}
                            value={f.kg(production.green_leaf_kg)}
                        />
                        <Stat
                            label={t('Made tea in stock')}
                            value={f.kg(stockKg)}
                        />
                    </div>
                </section>

                <section>
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-sm font-medium text-muted-foreground">
                            {t('Sales this month')}
                        </h2>
                        <Link
                            href={auctionInvoices()}
                            className="text-sm text-primary hover:underline"
                        >
                            {t('Open auction invoices')}
                        </Link>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Stat
                            label={t('Auction, net proceeds')}
                            value={f.money(sales.auction_amount)}
                            hint={f.kg(sales.auction_kg)}
                        />
                        <Stat
                            label={t('Retail sales')}
                            value={f.money(sales.retail_amount)}
                        />
                        <Stat
                            label={t('Due from brokers')}
                            value={f.money(sales.auction_due)}
                        />
                        <Stat
                            label={t('Due from customers')}
                            value={f.money(sales.customers_due)}
                        />
                    </div>
                </section>

                <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                    <section className="rounded-xl border">
                        <h2 className="border-b px-4 py-3 text-sm font-medium">
                            {t('Last 7 days')}
                        </h2>
                        <table className="w-full text-sm">
                            <thead className="text-left text-xs text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-2 font-medium">
                                        {t('Day')}
                                    </th>
                                    <th className="px-4 py-2 text-right font-medium">
                                        {t('Net leaf')}
                                    </th>
                                    <th className="px-4 py-2 text-right font-medium">
                                        {t('Leaf value')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {week.map((d) => (
                                    <tr key={d.date}>
                                        <td className="px-4 py-2">
                                            <Link
                                                href={intake({
                                                    query: { date: d.date },
                                                })}
                                                className="hover:underline"
                                            >
                                                {f.shortDay(d.date)}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-2 text-right tabular-nums">
                                            {f.kg(d.net_kg)}
                                        </td>
                                        <td className="px-4 py-2 text-right tabular-nums">
                                            {f.money(d.amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="border-t font-semibold">
                                <tr>
                                    <td className="px-4 py-2">{t('Total')}</td>
                                    <td className="px-4 py-2 text-right tabular-nums">
                                        {f.kg(weekKg)}
                                    </td>
                                    <td className="px-4 py-2 text-right tabular-nums">
                                        {f.money(weekAmount)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </section>

                    <section className="space-y-4">
                        <Stat
                            label={t('Total payable to suppliers')}
                            value={f.money(balances.payable)}
                        />
                        <Stat
                            label={t('Advances still to recover')}
                            value={f.money(balances.advances)}
                        />
                        <Link
                            href={suppliers()}
                            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                            <Leaf className="size-4" />
                            {t('See every supplier’s balance')}
                        </Link>
                    </section>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};

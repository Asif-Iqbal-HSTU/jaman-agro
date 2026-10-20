import { Form, Head, Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import Heading from '@/components/heading';
import { NativeSelect } from '@/components/native-select';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCanManage } from '@/hooks/use-can-manage';
import { useFormat } from '@/hooks/use-format';
import { useTrans } from '@/hooks/use-trans';
import { create, index, show } from '@/routes/retail-sales';
import type { Paginated, RetailSale } from '@/types';

type Props = {
    sales: Paginated<RetailSale>;
    totals: { count: number; amount: string; kg: string };
    filters: { from: string; to: string; customer: number | null };
    customers: { id: number; name: string }[];
};

export default function RetailSales({
    sales,
    totals,
    filters,
    customers,
}: Props) {
    const { t } = useTrans();
    const f = useFormat();
    const canManage = useCanManage();

    return (
        <>
            <Head title={t('Retail sales')} />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title={t('Retail sales')}
                        description={t(
                            'Tea sold directly to shops and buyers.',
                        )}
                    />
                    {canManage && (
                        <Button asChild>
                            <Link href={create()}>
                                <Plus /> {t('New sale')}
                            </Link>
                        </Button>
                    )}
                </div>

                <Form
                    {...index.form()}
                    options={{ preserveState: true }}
                    className="flex flex-wrap items-end gap-3"
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
                    <div className="grid gap-1">
                        <Label htmlFor="customer">{t('Customer')}</Label>
                        <NativeSelect
                            id="customer"
                            name="customer"
                            defaultValue={String(filters.customer ?? '')}
                            className="w-52"
                        >
                            <option value="">{t('All customers')}</option>
                            {customers.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </NativeSelect>
                    </div>
                    <Button type="submit" variant="outline">
                        {t('Show')}
                    </Button>
                </Form>

                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">
                            {t('Sales value')}
                        </p>
                        <p className="mt-1 text-xl font-semibold tabular-nums">
                            {f.money(totals.amount)}
                        </p>
                    </div>
                    <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">
                            {t('Tea sold')}
                        </p>
                        <p className="mt-1 text-xl font-semibold tabular-nums">
                            {f.kg(totals.kg)}
                        </p>
                    </div>
                    <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">
                            {t('Memos')}
                        </p>
                        <p className="mt-1 text-xl font-semibold tabular-nums">
                            {f.number(totals.count)}
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left text-xs text-muted-foreground uppercase">
                            <tr>
                                <th className="px-4 py-3 font-medium">
                                    {t('Memo')}
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    {t('Customer')}
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    {t('Tea')}
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    {t('Total')}
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    {t('Received')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {sales.data.map((s) => (
                                <tr key={s.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <Link
                                            href={show(s.id)}
                                            className="font-mono text-xs font-medium hover:underline"
                                        >
                                            {s.number}
                                        </Link>
                                        <p className="text-xs text-muted-foreground">
                                            {f.date(s.sold_on)}
                                        </p>
                                    </td>
                                    <td className="px-4 py-3">
                                        {s.customer?.name ??
                                            t('Walk-in customer')}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {s.items
                                            .map(
                                                (i) =>
                                                    `${i.grade?.code} ${f.decimal(i.kg)}`,
                                            )
                                            .join(', ')}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                                        {f.money(s.total_amount)}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {f.money(s.payment?.amount ?? 0)}
                                    </td>
                                </tr>
                            ))}
                            {sales.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-4 py-10 text-center text-muted-foreground"
                                    >
                                        {t('No sales in this period.')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination page={sales} />
            </div>
        </>
    );
}

RetailSales.layout = {
    breadcrumbs: [{ title: 'Retail sales', href: index() }],
};

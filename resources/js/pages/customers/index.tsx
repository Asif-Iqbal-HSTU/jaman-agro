import { Form, Head, Link } from '@inertiajs/react';
import { Plus, Search } from 'lucide-react';
import Heading from '@/components/heading';
import { Pagination } from '@/components/pagination';
import { Balance } from '@/components/suppliers/balance';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCanManage } from '@/hooks/use-can-manage';
import { useFormat } from '@/hooks/use-format';
import { useTrans } from '@/hooks/use-trans';
import { create, index, show } from '@/routes/customers';
import type { Paginated } from '@/types';

type Row = {
    id: number;
    name: string;
    phone: string | null;
    address: string | null;
    is_active: boolean;
    sales_amount: string;
    balance: string;
};

type Props = {
    customers: Paginated<Row>;
    filters: { search: string };
    receivable: string;
};

export default function Customers({ customers, filters, receivable }: Props) {
    const { t } = useTrans();
    const f = useFormat();
    const canManage = useCanManage();

    return (
        <>
            <Head title={t('Customers')} />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title={t('Customers')}
                        description={t(
                            'Retail buyers and what each owes the factory.',
                        )}
                    />
                    {canManage && (
                        <Button asChild>
                            <Link href={create()}>
                                <Plus /> {t('Add customer')}
                            </Link>
                        </Button>
                    )}
                </div>

                <div className="max-w-sm rounded-xl border p-4">
                    <p className="text-xs text-muted-foreground">
                        {t('Total due from customers')}
                    </p>
                    <p className="mt-1 text-xl font-semibold tabular-nums">
                        {f.money(receivable)}
                    </p>
                </div>

                <Form
                    {...index.form()}
                    options={{ preserveState: true }}
                    className="flex max-w-sm gap-2"
                >
                    <Input
                        name="search"
                        defaultValue={filters.search}
                        placeholder={t('Name or phone')}
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

                <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left text-xs text-muted-foreground uppercase">
                            <tr>
                                <th className="px-4 py-3 font-medium">
                                    {t('Customer')}
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    {t('Phone')}
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    {t('Total bought')}
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    {t('Balance')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {customers.data.map((c) => (
                                <tr key={c.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3">
                                        <Link
                                            href={show(c.id)}
                                            className="font-medium hover:underline"
                                        >
                                            {c.name}
                                        </Link>
                                        {!c.is_active && (
                                            <Badge
                                                variant="outline"
                                                className="ml-2"
                                            >
                                                {t('Inactive')}
                                            </Badge>
                                        )}
                                        {c.address && (
                                            <p className="text-xs text-muted-foreground">
                                                {c.address}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        {c.phone ?? '—'}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {f.money(c.sales_amount)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium">
                                        <Balance value={c.balance} />
                                    </td>
                                </tr>
                            ))}
                            {customers.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-4 py-10 text-center text-muted-foreground"
                                    >
                                        {t('No customers found.')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination page={customers} />
            </div>
        </>
    );
}

Customers.layout = {
    breadcrumbs: [{ title: 'Customers', href: index() }],
};

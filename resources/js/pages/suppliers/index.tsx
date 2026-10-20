import { Form, Head, Link } from '@inertiajs/react';
import { Plus, Search } from 'lucide-react';
import Heading from '@/components/heading';
import { NativeSelect } from '@/components/native-select';
import { Pagination } from '@/components/pagination';
import { Balance } from '@/components/suppliers/balance';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCanManage } from '@/hooks/use-can-manage';
import { useFormat } from '@/hooks/use-format';
import { useTrans } from '@/hooks/use-trans';
import { create, index, show } from '@/routes/suppliers';
import type { Paginated } from '@/types';

type Row = {
    id: number;
    code: string | null;
    name: string;
    phone: string | null;
    garden_name: string | null;
    is_active: boolean;
    leaf_kg: string;
    balance: string;
};

type Props = {
    suppliers: Paginated<Row>;
    filters: { search: string; status: string };
    summary: { payable: string; advances: string };
};

export default function Suppliers({ suppliers, filters, summary }: Props) {
    const { t } = useTrans();
    const f = useFormat();
    const canManage = useCanManage();

    return (
        <>
            <Head title={t('Suppliers')} />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title={t('Suppliers')}
                        description={t(
                            'Gardens that sell green leaf to the factory, and what each is owed.',
                        )}
                    />
                    {canManage && (
                        <Button asChild>
                            <Link href={create()}>
                                <Plus /> {t('Add supplier')}
                            </Link>
                        </Button>
                    )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">
                            {t('Total payable to suppliers')}
                        </p>
                        <p className="mt-1 text-xl font-semibold tabular-nums">
                            {f.money(summary.payable)}
                        </p>
                    </div>
                    <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">
                            {t('Advances still to recover')}
                        </p>
                        <p className="mt-1 text-xl font-semibold text-amber-700 tabular-nums dark:text-amber-400">
                            {f.money(summary.advances)}
                        </p>
                    </div>
                </div>

                <Form
                    {...index.form()}
                    options={{ preserveState: true }}
                    className="flex flex-wrap gap-2"
                >
                    <Input
                        name="search"
                        defaultValue={filters.search}
                        placeholder={t('Name, code, phone or garden')}
                        className="max-w-xs"
                    />
                    <NativeSelect
                        name="status"
                        defaultValue={filters.status}
                        className="w-40"
                    >
                        <option value="">{t('All')}</option>
                        <option value="active">{t('Active')}</option>
                        <option value="inactive">{t('Inactive')}</option>
                    </NativeSelect>
                    <Button type="submit" variant="outline">
                        <Search /> {t('Search')}
                    </Button>
                </Form>

                <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left text-xs text-muted-foreground uppercase">
                            <tr>
                                <th className="px-4 py-3 font-medium">
                                    {t('Supplier')}
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    {t('Phone')}
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    {t('Leaf supplied')}
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    {t('Balance')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {suppliers.data.map((s) => (
                                <tr key={s.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3">
                                        <Link
                                            href={show(s.id)}
                                            className="font-medium hover:underline"
                                        >
                                            {s.name}
                                        </Link>
                                        {s.code && (
                                            <span className="ml-2 text-xs text-muted-foreground">
                                                {s.code}
                                            </span>
                                        )}
                                        {!s.is_active && (
                                            <Badge
                                                variant="outline"
                                                className="ml-2"
                                            >
                                                {t('Inactive')}
                                            </Badge>
                                        )}
                                        {s.garden_name && (
                                            <p className="text-xs text-muted-foreground">
                                                {s.garden_name}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        {s.phone ?? '—'}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {f.kg(s.leaf_kg)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium">
                                        <Balance value={s.balance} />
                                    </td>
                                </tr>
                            ))}
                            {suppliers.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-4 py-10 text-center text-muted-foreground"
                                    >
                                        {t('No suppliers found.')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination page={suppliers} />
            </div>
        </>
    );
}

Suppliers.layout = {
    breadcrumbs: [{ title: 'Suppliers', href: index() }],
};

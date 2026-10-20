import { Form, Head, Link } from '@inertiajs/react';
import { Pencil, Plus, Search } from 'lucide-react';
import Heading from '@/components/heading';
import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCanManage } from '@/hooks/use-can-manage';
import { useFormat } from '@/hooks/use-format';
import { useTrans } from '@/hooks/use-trans';
import { index as wages } from '@/routes/wages';
import { create, edit, index } from '@/routes/workers';
import type { Option, Paginated, Worker } from '@/types';

type Props = {
    workers: Paginated<Worker & { owed: string }>;
    filters: { search: string };
    payTypes: Option[];
};

export default function Workers({ workers, filters, payTypes }: Props) {
    const { t } = useTrans();
    const f = useFormat();
    const canManage = useCanManage();
    const payLabel = (v: string) =>
        payTypes.find((o) => o.value === v)?.label ?? v;

    return (
        <>
            <Head title={t('Workers')} />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title={t('Workers')}
                        description={t(
                            'Daily workers, how each is paid and what the factory still owes them.',
                        )}
                    />
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href={wages()}>{t('Wages')}</Link>
                        </Button>
                        {canManage && (
                            <Button asChild>
                                <Link href={create()}>
                                    <Plus /> {t('Add worker')}
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                <Form
                    {...index.form()}
                    options={{ preserveState: true }}
                    className="flex max-w-sm gap-2"
                >
                    <Input
                        name="search"
                        defaultValue={filters.search}
                        placeholder={t('Name')}
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
                                    {t('Name')}
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    {t('Pay')}
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    {t('Hourly rate')}
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    {t('Owed')}
                                </th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {workers.data.map((w) => (
                                <tr key={w.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3">
                                        <span className="font-medium">
                                            {w.name}
                                        </span>
                                        {!w.is_active && (
                                            <Badge
                                                variant="outline"
                                                className="ml-2"
                                            >
                                                {t('Inactive')}
                                            </Badge>
                                        )}
                                        {w.phone && (
                                            <p className="text-xs text-muted-foreground">
                                                {w.phone}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant="secondary">
                                            {payLabel(w.pay_type)}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {w.hourly_rate
                                            ? f.money(w.hourly_rate)
                                            : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                                        {f.money(w.owed)}
                                    </td>
                                    <td className="px-2 py-2 text-right">
                                        {canManage && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                asChild
                                            >
                                                <Link
                                                    href={edit(w.id)}
                                                    aria-label={t('Edit')}
                                                >
                                                    <Pencil />
                                                </Link>
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {workers.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-4 py-10 text-center text-muted-foreground"
                                    >
                                        {t('No workers yet.')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination page={workers} />
            </div>
        </>
    );
}

Workers.layout = {
    breadcrumbs: [{ title: 'Workers', href: index() }],
};

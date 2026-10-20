import { Form, Head, Link, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { EditedBadge } from '@/components/edited-badge';
import Heading from '@/components/heading';
import { RecordActions } from '@/components/record-actions';
import { NativeSelect } from '@/components/native-select';
import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCanManage } from '@/hooks/use-can-manage';
import { useFormat } from '@/hooks/use-format';
import { useTrans } from '@/hooks/use-trans';
import { create, destroy, edit, index } from '@/routes/supplier-payments';
import { show as showSupplier } from '@/routes/suppliers';
import type {
    Option,
    Paginated,
    SupplierPayment,
    SupplierSummary,
} from '@/types';

type Props = {
    payments: Paginated<SupplierPayment>;
    totals: { advance: string; payment: string };
    filters: {
        from: string;
        to: string;
        supplier: number | null;
        type: string | null;
    };
    suppliers: SupplierSummary[];
    types: Option[];
    methods: Option[];
};

export default function SupplierPayments({
    payments,
    totals,
    filters,
    suppliers,
    types,
    methods,
}: Props) {
    const { t } = useTrans();
    const f = useFormat();
    const canManage = useCanManage();
    const label = (options: Option[], value: string) =>
        options.find((o) => o.value === value)?.label ?? value;

    const remove = (payment: SupplierPayment) => {
        if (window.confirm(t('Delete this payment? This cannot be undone.'))) {
            router.delete(destroy(payment.id), { preserveScroll: true });
        }
    };

    return (
        <>
            <Head title={t('Supplier payments')} />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title={t('Supplier payments')}
                        description={t(
                            'Payments for leaf and advances given to suppliers.',
                        )}
                    />
                    {canManage && (
                        <Button asChild>
                            <Link href={create()}>
                                <Plus /> {t('Record payment')}
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
                        <Label htmlFor="supplier">{t('Supplier')}</Label>
                        <NativeSelect
                            id="supplier"
                            name="supplier"
                            defaultValue={String(filters.supplier ?? '')}
                            className="w-52"
                        >
                            <option value="">{t('All suppliers')}</option>
                            {suppliers.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </NativeSelect>
                    </div>
                    <div className="grid gap-1">
                        <Label htmlFor="type">{t('Type')}</Label>
                        <NativeSelect
                            id="type"
                            name="type"
                            defaultValue={filters.type ?? ''}
                            className="w-36"
                        >
                            <option value="">{t('All')}</option>
                            {types.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </NativeSelect>
                    </div>
                    <Button type="submit" variant="outline">
                        {t('Show')}
                    </Button>
                </Form>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">
                            {t('Paid for leaf')}
                        </p>
                        <p className="mt-1 text-xl font-semibold tabular-nums">
                            {f.money(totals.payment)}
                        </p>
                    </div>
                    <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">
                            {t('Advances given')}
                        </p>
                        <p className="mt-1 text-xl font-semibold tabular-nums">
                            {f.money(totals.advance)}
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left text-xs text-muted-foreground uppercase">
                            <tr>
                                <th className="px-4 py-3 font-medium">
                                    {t('Date')}
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    {t('Supplier')}
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    {t('Type')}
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    {t('Paid by')}
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    {t('Amount')}
                                </th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {payments.data.map((p) => (
                                <tr key={p.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {f.date(p.paid_on)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Link
                                            href={showSupplier(p.supplier_id)}
                                            className="hover:underline"
                                        >
                                            {p.supplier?.name}
                                        </Link>
                                        {p.reference && (
                                            <p className="text-xs text-muted-foreground">
                                                {p.reference}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge
                                            variant={
                                                p.type === 'advance'
                                                    ? 'outline'
                                                    : 'secondary'
                                            }
                                        >
                                            {label(types, p.type)}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        {label(methods, p.method)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                                        {f.money(p.amount)}
                                        <EditedBadge at={p.edited_at} />
                                    </td>
                                    <td className="px-2 py-2 text-right whitespace-nowrap">
                                        {canManage && (
                                            <>
                                                <RecordActions
                                                    lock={p.edit_lock}
                                                    subject="supplier_payment"
                                                    id={p.id}
                                                    editHref={edit(p.id)}
                                                    onDelete={() => remove(p)}
                                                />
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {payments.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-10 text-center text-muted-foreground"
                                    >
                                        {t('No payments in this period.')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination page={payments} />
            </div>
        </>
    );
}

SupplierPayments.layout = {
    breadcrumbs: [{ title: 'Supplier payments', href: index() }],
};

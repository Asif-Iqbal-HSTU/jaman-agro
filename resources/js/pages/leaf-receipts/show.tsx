import { Head, Link } from '@inertiajs/react';
import { Leaf, Plus, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCanManage } from '@/hooks/use-can-manage';
import { useFormat } from '@/hooks/use-format';
import { useTrans } from '@/hooks/use-trans';
import { create, index } from '@/routes/leaf-receipts';
import type { LeafReceipt } from '@/types';

export default function ReceiptSlip({ receipt }: { receipt: LeafReceipt }) {
    const { t } = useTrans();
    const f = useFormat();
    const canManage = useCanManage();

    const rows: [string, string, boolean?][] = [
        [t('Gross weight'), f.kg(receipt.gross_kg)],
        [t('Bags / basket weight'), `− ${f.kg(receipt.tare_kg)}`],
        [
            receipt.deduction_type === 'percent'
                ? t('Moisture deduction (:percent%)', {
                      percent: f.decimal(receipt.deduction_percent),
                  })
                : t('Moisture deduction'),
            `− ${f.kg(receipt.deduction_kg)}`,
        ],
        [t('Net weight'), f.kg(receipt.net_kg), true],
        [
            t('Rate'),
            receipt.rate ? `${f.money(receipt.rate)} / kg` : t('Not set yet'),
        ],
        [
            t('Amount'),
            receipt.amount ? f.money(receipt.amount) : t('Rate pending'),
            true,
        ],
    ];

    return (
        <>
            <Head title={receipt.number} />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-wrap gap-2 print:hidden">
                    <Button onClick={() => window.print()}>
                        <Printer /> {t('Print slip')}
                    </Button>
                    {canManage && (
                        <Button variant="outline" asChild>
                            <Link
                                href={create({
                                    query: { date: receipt.received_on },
                                })}
                            >
                                <Plus /> {t('Record another delivery')}
                            </Link>
                        </Button>
                    )}
                    <Button variant="ghost" asChild>
                        <Link
                            href={index({
                                query: { date: receipt.received_on },
                            })}
                        >
                            {t('Back to the day')}
                        </Link>
                    </Button>
                </div>

                <article className="mx-auto max-w-sm rounded-xl border bg-card p-6 print:max-w-none print:border-0 print:p-0">
                    <header className="flex items-center gap-3 border-b pb-4">
                        <span className="flex size-10 items-center justify-center rounded-full bg-[#1f4a2b] text-[#e8d7a6] print:border print:bg-transparent print:text-black">
                            <Leaf className="size-5" />
                        </span>
                        <div>
                            <p className="font-serif text-lg font-semibold">
                                {t('Jaman Agro')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {t('Green leaf receipt')}
                            </p>
                        </div>
                        <p className="ml-auto text-right font-mono text-sm">
                            {receipt.number}
                            <span className="block font-sans text-xs text-muted-foreground">
                                {f.date(receipt.received_on)}
                            </span>
                        </p>
                    </header>

                    <div className="border-b py-4 text-sm">
                        <p className="font-medium">
                            {receipt.supplier?.name}
                            {receipt.supplier?.code && (
                                <span className="ml-2 text-muted-foreground">
                                    {receipt.supplier.code}
                                </span>
                            )}
                        </p>
                        <p className="text-muted-foreground">
                            {[
                                receipt.supplier?.garden_name,
                                receipt.supplier?.phone,
                                receipt.delivery_mode === 'factory_vehicle'
                                    ? `${t('Factory vehicle')}: ${receipt.vehicle?.name ?? ''}`
                                    : receipt.vehicle_no,
                            ]
                                .filter(Boolean)
                                .join(' · ')}
                        </p>
                    </div>

                    <dl className="space-y-2 py-4 text-sm">
                        {rows.map(([label, value, strong]) => (
                            <div
                                key={label}
                                className={
                                    strong
                                        ? 'flex justify-between border-t pt-2 text-base font-semibold'
                                        : 'flex justify-between'
                                }
                            >
                                <dt>{label}</dt>
                                <dd className="tabular-nums">{value}</dd>
                            </div>
                        ))}
                    </dl>

                    {receipt.notes && (
                        <p className="border-t pt-3 text-sm text-muted-foreground">
                            {receipt.notes}
                        </p>
                    )}

                    <footer className="mt-6 flex justify-between gap-6 text-xs text-muted-foreground">
                        <p>
                            {t('Recorded by :name', {
                                name: receipt.recorder?.name ?? '—',
                            })}
                        </p>
                        <p className="border-t border-dashed pt-1">
                            {t('Supplier signature')}
                        </p>
                    </footer>
                </article>
            </div>
        </>
    );
}

ReceiptSlip.layout = {
    breadcrumbs: [{ title: 'Leaf intake', href: index() }],
};

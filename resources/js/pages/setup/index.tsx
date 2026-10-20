import { Head, Link } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import { CheckCircle2, Circle } from 'lucide-react';
import Heading from '@/components/heading';
import { useFormat } from '@/hooks/use-format';
import { useTrans } from '@/hooks/use-trans';
import { setup } from '@/routes';
import { index as brokers } from '@/routes/brokers';
import { index as customers } from '@/routes/customers';
import { index as expenseCategories } from '@/routes/expense-categories';
import { index as grades } from '@/routes/grades';
import { index as pieceRates } from '@/routes/piece-rates';
import { adjust } from '@/routes/stock';
import { index as suppliers } from '@/routes/suppliers';
import { index as vehicles } from '@/routes/vehicles';
import { index as warehouses } from '@/routes/warehouses';
import { index as workers } from '@/routes/workers';

type Counts = {
    grades: number;
    suppliers: number;
    suppliers_with_opening: number;
    customers: number;
    vehicles: number;
    warehouses: number;
    brokers: number;
    workers: number;
    piece_rates: number;
    expense_categories: number;
    opening_stock_lines: number;
};

type Step = {
    title: string;
    detail: string;
    count: number;
    href: NonNullable<InertiaLinkProps['href']>;
    optional?: boolean;
};

export default function Setup({ counts }: { counts: Counts }) {
    const { t } = useTrans();
    const f = useFormat();

    const steps: Step[] = [
        {
            title: t('Tea grades'),
            detail: t('Check the grades the factory makes (BOP, PF, Dust…).'),
            count: counts.grades,
            href: grades(),
        },
        {
            title: t('Suppliers'),
            detail: t('Every garden that sells leaf to the factory.'),
            count: counts.suppliers,
            href: suppliers(),
        },
        {
            title: t('Opening supplier balances'),
            detail: t(
                'What the factory owed each supplier (or was owed) on the start day. Set it on each supplier.',
            ),
            count: counts.suppliers_with_opening,
            href: suppliers(),
            optional: true,
        },
        {
            title: t('Vehicles'),
            detail: t('The factory’s own vehicles that collect leaf.'),
            count: counts.vehicles,
            href: vehicles(),
        },
        {
            title: t('Warehouses'),
            detail: t('The auction warehouses invoices are sent to.'),
            count: counts.warehouses,
            href: warehouses(),
        },
        {
            title: t('Brokers'),
            detail: t('The brokers who sell the tea at auction.'),
            count: counts.brokers,
            href: brokers(),
        },
        {
            title: t('Customers'),
            detail: t('Retail buyers, with what each owes on the start day.'),
            count: counts.customers,
            href: customers(),
            optional: true,
        },
        {
            title: t('Workers'),
            detail: t('Hourly and contract workers.'),
            count: counts.workers,
            href: workers(),
        },
        {
            title: t('Job rates'),
            detail: t(
                'Contract job rates. Check the starting rates with the manager.',
            ),
            count: counts.piece_rates,
            href: pieceRates(),
        },
        {
            title: t('Expense categories'),
            detail: t('Factory and vehicle expense headings.'),
            count: counts.expense_categories,
            href: expenseCategories(),
        },
        {
            title: t('Opening stock'),
            detail: t(
                'The made tea in the store on the start day, by grade, entered as a stock adjustment.',
            ),
            count: counts.opening_stock_lines,
            href: adjust(),
        },
    ];

    const done = steps.filter((s) => s.count > 0).length;

    return (
        <>
            <Head title={t('Go-live checklist')} />
            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title={t('Go-live checklist')}
                    description={t(
                        'Everything to enter once before daily use starts. :done of :total done.',
                        {
                            done: f.number(done),
                            total: f.number(steps.length),
                        },
                    )}
                />
                <ol className="max-w-3xl divide-y rounded-xl border">
                    {steps.map((s, i) => (
                        <li key={i}>
                            <Link
                                href={s.href}
                                className="flex items-start gap-3 p-4 hover:bg-muted/40"
                            >
                                {s.count > 0 ? (
                                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                                ) : (
                                    <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                                )}
                                <span className="flex-1">
                                    <span className="font-medium">
                                        {s.title}
                                        {s.optional && (
                                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                                                ({t('if any')})
                                            </span>
                                        )}
                                    </span>
                                    <span className="block text-sm text-muted-foreground">
                                        {s.detail}
                                    </span>
                                </span>
                                <span className="text-sm text-muted-foreground tabular-nums">
                                    {f.number(s.count)}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ol>
            </div>
        </>
    );
}

Setup.layout = {
    breadcrumbs: [{ title: 'Go-live checklist', href: setup() }],
};

import { Head, Link, router, useForm } from '@inertiajs/react';
import { Settings2 } from 'lucide-react';
import { DayNav } from '@/components/day-nav';
import { EditedBadge } from '@/components/edited-badge';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { NativeSelect } from '@/components/native-select';
import { RecordActions } from '@/components/record-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useCanManage } from '@/hooks/use-can-manage';
import { useFormat } from '@/hooks/use-format';
import { useTrans } from '@/hooks/use-trans';
import { index as jobRates } from '@/routes/piece-rates';
import { destroy, index, store } from '@/routes/piece-work';
import type { Lockable, PieceRate } from '@/types';

type Work = Lockable & {
    id: number;
    work_date: string;
    quantity: string;
    rate: string;
    amount: string;
    notes: string | null;
    worker?: { id: number; name: string };
    job?: { id: number; name: string; unit: PieceRate['unit'] };
};

type Props = {
    date: string;
    today: string;
    works: Work[];
    workers: { id: number; name: string }[];
    jobs: PieceRate[];
    leafKg: string;
    total: string;
};

export default function PieceWork({
    date,
    today,
    works,
    workers,
    jobs,
    leafKg,
    total,
}: Props) {
    const { t } = useTrans();
    const f = useFormat();
    const canManage = useCanManage();
    const unitLabel = (u: PieceRate['unit']) =>
        ({ kg: t('kg'), bag: t('bags'), ton: t('tons'), job: t('jobs') })[u];

    const form = useForm({
        work_date: date,
        worker_id: '',
        piece_rate_id: '',
        quantity: '',
        notes: '',
    });
    const { data, setData, errors, processing } = form;
    const job = jobs.find((j) => String(j.id) === data.piece_rate_id);
    const amount =
        job && data.quantity ? Number(job.rate) * Number(data.quantity) : null;

    const remove = (w: Work) => {
        if (window.confirm(t('Delete this entry? This cannot be undone.'))) {
            router.delete(destroy(w.id), { preserveScroll: true });
        }
    };

    return (
        <>
            <Head title={t('Contract work')} />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title={t('Contract work')}
                        description={t(
                            'Work paid by the piece: leaf unloading, bagging, stacking, loading and the like.',
                        )}
                    />
                    {canManage && (
                        <Button variant="outline" asChild>
                            <Link href={jobRates()}>
                                <Settings2 /> {t('Job rates')}
                            </Link>
                        </Button>
                    )}
                </div>

                <DayNav
                    date={date}
                    today={today}
                    href={(d) => index({ query: { date: d } })}
                />

                {canManage && (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            form.submit(store(), {
                                preserveScroll: true,
                                onSuccess: () =>
                                    form.reset('quantity', 'notes'),
                            });
                        }}
                        className="grid items-end gap-3 rounded-xl border p-4 md:grid-cols-[1fr_1fr_10rem_1fr_auto]"
                    >
                        <div className="grid gap-1">
                            <Label htmlFor="worker_id">{t('Worker')}</Label>
                            <NativeSelect
                                id="worker_id"
                                value={data.worker_id}
                                onChange={(e) =>
                                    setData('worker_id', e.target.value)
                                }
                                required
                            >
                                <option value="">{t('Choose a worker')}</option>
                                {workers.map((w) => (
                                    <option key={w.id} value={w.id}>
                                        {w.name}
                                    </option>
                                ))}
                            </NativeSelect>
                            <InputError message={errors.worker_id} />
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="piece_rate_id">{t('Job')}</Label>
                            <NativeSelect
                                id="piece_rate_id"
                                value={data.piece_rate_id}
                                onChange={(e) =>
                                    setData('piece_rate_id', e.target.value)
                                }
                                required
                            >
                                <option value="">{t('Choose a job')}</option>
                                {jobs.map((j) => (
                                    <option key={j.id} value={j.id}>
                                        {t(j.name)} — {f.money(j.rate)} /{' '}
                                        {unitLabel(j.unit)}
                                    </option>
                                ))}
                            </NativeSelect>
                            <InputError message={errors.piece_rate_id} />
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="quantity">
                                {t('Quantity')}{' '}
                                {job && (
                                    <span className="text-muted-foreground">
                                        ({unitLabel(job.unit)})
                                    </span>
                                )}
                            </Label>
                            <Input
                                id="quantity"
                                type="number"
                                step="0.01"
                                min="0"
                                value={data.quantity}
                                onChange={(e) =>
                                    setData('quantity', e.target.value)
                                }
                                required
                            />
                            {job?.unit === 'kg' && Number(leafKg) > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setData('quantity', leafKg)}
                                    className="text-left text-xs text-primary hover:underline"
                                >
                                    {t('Use today’s leaf: :kg', {
                                        kg: f.kg(leafKg),
                                    })}
                                </button>
                            )}
                            <InputError message={errors.quantity} />
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="notes">{t('Notes')}</Label>
                            <Input
                                id="notes"
                                value={data.notes}
                                onChange={(e) =>
                                    setData('notes', e.target.value)
                                }
                                placeholder={t('Optional')}
                            />
                        </div>
                        <div className="grid gap-1">
                            <p className="text-right text-sm tabular-nums">
                                {amount === null ? '' : f.money(amount)}
                            </p>
                            <Button disabled={processing}>
                                {processing && <Spinner />}
                                {t('Add')}
                            </Button>
                        </div>
                        {workers.length === 0 && (
                            <p className="text-xs text-amber-700 md:col-span-5 dark:text-amber-400">
                                {t(
                                    'No contract workers yet. Add a worker paid by contract under Workers.',
                                )}
                            </p>
                        )}
                    </form>
                )}

                <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left text-xs text-muted-foreground uppercase">
                            <tr>
                                <th className="px-4 py-3 font-medium">
                                    {t('Worker')}
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    {t('Job')}
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    {t('Quantity')}
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    {t('Rate')}
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    {t('Amount')}
                                </th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {works.map((w) => (
                                <tr key={w.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3 font-medium">
                                        {w.worker?.name}
                                        <EditedBadge at={w.edited_at} />
                                    </td>
                                    <td className="px-4 py-3">
                                        {w.job ? t(w.job.name) : ''}
                                        {w.notes && (
                                            <p className="text-xs text-muted-foreground">
                                                {w.notes}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {f.decimal(w.quantity)}{' '}
                                        {w.job && unitLabel(w.job.unit)}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {f.money(w.rate)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                                        {f.money(w.amount)}
                                    </td>
                                    <td className="px-2 py-2 text-right whitespace-nowrap">
                                        {canManage && (
                                            <RecordActions
                                                lock={w.edit_lock}
                                                subject="piece_work"
                                                id={w.id}
                                                onDelete={() => remove(w)}
                                            />
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {works.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-10 text-center text-muted-foreground"
                                    >
                                        {t(
                                            'No contract work recorded on this day.',
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {works.length > 0 && (
                            <tfoot className="border-t bg-muted/30 font-semibold">
                                <tr>
                                    <td colSpan={4} className="px-4 py-3">
                                        {t('Total')}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {f.money(total)}
                                    </td>
                                    <td />
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </>
    );
}

PieceWork.layout = {
    breadcrumbs: [{ title: 'Contract work', href: index() }],
};

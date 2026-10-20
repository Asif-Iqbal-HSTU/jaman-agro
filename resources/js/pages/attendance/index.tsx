import { Head, Link, useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { DayNav } from '@/components/day-nav';
import { EditedBadge } from '@/components/edited-badge';
import Heading from '@/components/heading';
import { RecordActions } from '@/components/record-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useCanManage } from '@/hooks/use-can-manage';
import { useFormat } from '@/hooks/use-format';
import { useTrans } from '@/hooks/use-trans';
import { index, store } from '@/routes/attendance';
import { create as addWorker } from '@/routes/workers';
import type { EditLockState } from '@/types';

type Row = {
    id: number;
    name: string;
    hourly_rate: string | null;
    attendance: {
        id: number;
        time_in: string;
        time_out: string;
        hours: string;
        rate: string;
        amount: string;
        notes: string | null;
        edit_lock: EditLockState;
        edited_at: string | null;
    } | null;
};

type Props = {
    date: string;
    today: string;
    workers: Row[];
    totals: { present: number; hours: string; amount: string };
};

/** Hours between two HH:MM times; a shift past midnight wraps to the next day. */
const hoursBetween = (from: string, to: string) => {
    if (!from || !to) {
        return 0;
    }

    const [h1, m1] = from.split(':').map(Number);
    const [h2, m2] = to.split(':').map(Number);
    let minutes = h2 * 60 + m2 - (h1 * 60 + m1);

    if (minutes < 0) {
        minutes += 24 * 60;
    }

    return Math.round((minutes / 60) * 100) / 100;
};

export default function Attendance({ date, today, workers, totals }: Props) {
    const { t } = useTrans();
    const f = useFormat();
    const canManage = useCanManage();

    const form = useForm({
        work_date: date,
        rows: workers.map((w) => ({
            worker_id: w.id,
            time_in: w.attendance?.time_in.slice(0, 5) ?? '',
            time_out: w.attendance?.time_out.slice(0, 5) ?? '',
            notes: w.attendance?.notes ?? '',
        })),
    });
    const { data, setData, processing, errors, isDirty } = form;

    const setRow = (
        i: number,
        field: 'time_in' | 'time_out' | 'notes',
        value: string,
    ) =>
        setData(
            'rows',
            data.rows.map((r, j) => (i === j ? { ...r, [field]: value } : r)),
        );

    const isLocked = (w: Row) =>
        w.attendance?.edit_lock === 'locked' ||
        w.attendance?.edit_lock === 'pending';

    const rateOf = (w: Row) => Number(w.attendance?.rate ?? w.hourly_rate ?? 0);
    const preview = data.rows.reduce(
        (sum, r, i) => {
            const hours = hoursBetween(r.time_in, r.time_out);

            return {
                hours: sum.hours + hours,
                amount: sum.amount + hours * rateOf(workers[i]),
            };
        },
        { hours: 0, amount: 0 },
    );

    const fillAll = () => {
        const first = data.rows.find((r) => r.time_in && r.time_out);

        if (!first) {
            return;
        }

        setData(
            'rows',
            data.rows.map((r, i) =>
                r.time_in || r.time_out || isLocked(workers[i])
                    ? r
                    : {
                          ...r,
                          time_in: first.time_in,
                          time_out: first.time_out,
                      },
            ),
        );
    };

    return (
        <>
            <Head title={t('Attendance')} />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title={t('Attendance')}
                        description={t(
                            'Time in and time out of the hourly workers. Pay is worked out from the hours.',
                        )}
                    />
                    {canManage && (
                        <Button variant="outline" asChild>
                            <Link href={addWorker()}>
                                <Plus /> {t('Add worker')}
                            </Link>
                        </Button>
                    )}
                </div>

                <DayNav
                    date={date}
                    today={today}
                    href={(d) => index({ query: { date: d } })}
                />

                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">
                            {t('Present')}
                        </p>
                        <p className="mt-1 text-xl font-semibold tabular-nums">
                            {f.number(totals.present)} /{' '}
                            {f.number(workers.length)}
                        </p>
                    </div>
                    <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">
                            {t('Hours')}
                        </p>
                        <p className="mt-1 text-xl font-semibold tabular-nums">
                            {f.decimal(preview.hours)}
                        </p>
                    </div>
                    <div className="rounded-xl border p-4">
                        <p className="text-xs text-muted-foreground">
                            {t('Wages for the day')}
                        </p>
                        <p className="mt-1 text-xl font-semibold tabular-nums">
                            {f.money(preview.amount)}
                        </p>
                    </div>
                </div>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.submit(store(), { preserveScroll: true });
                    }}
                    className="space-y-4"
                >
                    <div className="overflow-x-auto rounded-xl border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-left text-xs text-muted-foreground uppercase">
                                <tr>
                                    <th className="px-4 py-3 font-medium">
                                        {t('Worker')}
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        {t('Time in')}
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        {t('Time out')}
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium">
                                        {t('Hours')}
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium">
                                        {t('Rate')}
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium">
                                        {t('Amount')}
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        {t('Notes')}
                                    </th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {workers.map((w, i) => {
                                    const row = data.rows[i];
                                    const hours = hoursBetween(
                                        row.time_in,
                                        row.time_out,
                                    );
                                    const locked = isLocked(w);
                                    const readOnly = !canManage || locked;

                                    return (
                                        <tr
                                            key={w.id}
                                            className="hover:bg-muted/30"
                                        >
                                            <td className="px-4 py-2 font-medium">
                                                {w.name}
                                                <EditedBadge
                                                    at={w.attendance?.edited_at}
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <Input
                                                    type="time"
                                                    value={row.time_in}
                                                    onChange={(e) =>
                                                        setRow(
                                                            i,
                                                            'time_in',
                                                            e.target.value,
                                                        )
                                                    }
                                                    disabled={readOnly}
                                                    className="w-32"
                                                    aria-label={t('Time in')}
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <Input
                                                    type="time"
                                                    value={row.time_out}
                                                    onChange={(e) =>
                                                        setRow(
                                                            i,
                                                            'time_out',
                                                            e.target.value,
                                                        )
                                                    }
                                                    disabled={readOnly}
                                                    className="w-32"
                                                    aria-label={t('Time out')}
                                                />
                                            </td>
                                            <td className="px-4 py-2 text-right tabular-nums">
                                                {hours ? f.decimal(hours) : '—'}
                                            </td>
                                            <td className="px-4 py-2 text-right text-muted-foreground tabular-nums">
                                                {f.money(rateOf(w))}
                                            </td>
                                            <td className="px-4 py-2 text-right font-medium tabular-nums">
                                                {hours
                                                    ? f.money(hours * rateOf(w))
                                                    : '—'}
                                            </td>
                                            <td className="px-4 py-2">
                                                <Input
                                                    value={row.notes}
                                                    onChange={(e) =>
                                                        setRow(
                                                            i,
                                                            'notes',
                                                            e.target.value,
                                                        )
                                                    }
                                                    disabled={readOnly}
                                                    className="min-w-32"
                                                    aria-label={t('Notes')}
                                                />
                                            </td>
                                            <td className="px-2 py-2 text-right whitespace-nowrap">
                                                {canManage &&
                                                    locked &&
                                                    w.attendance && (
                                                        <RecordActions
                                                            lock={
                                                                w.attendance
                                                                    .edit_lock
                                                            }
                                                            subject="attendance"
                                                            id={w.attendance.id}
                                                        />
                                                    )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {workers.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-4 py-10 text-center text-muted-foreground"
                                        >
                                            {t(
                                                'No hourly workers yet. Add them under Workers.',
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {Object.keys(errors).length > 0 && (
                        <p className="text-sm text-destructive">
                            {t(
                                'Check the times: both time in and time out are needed.',
                            )}
                        </p>
                    )}
                    {canManage && workers.length > 0 && (
                        <div className="flex flex-wrap items-center gap-3">
                            <Button disabled={processing || !isDirty}>
                                {processing && <Spinner />}
                                {t('Save attendance')}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={fillAll}
                            >
                                {t('Copy the first times to everyone blank')}
                            </Button>
                            <p className="text-xs text-muted-foreground">
                                {t(
                                    'Leave both times empty for a worker who was absent. A shift past midnight is counted into the next day.',
                                )}
                            </p>
                        </div>
                    )}
                </form>
            </div>
        </>
    );
}

Attendance.layout = {
    breadcrumbs: [{ title: 'Attendance', href: index() }],
};

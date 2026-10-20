import { Head, router } from '@inertiajs/react';
import { Check, X } from 'lucide-react';
import Heading from '@/components/heading';
import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFormat } from '@/hooks/use-format';
import { useTrans } from '@/hooks/use-trans';
import { index, update } from '@/routes/admin/unlock-requests';
import type { Paginated } from '@/types';

type Request = {
    id: number;
    subject: string;
    subject_id: number;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    requester: string | null;
    decider: string | null;
    created_at: string | null;
    decided_at: string | null;
    expires_at: string | null;
};

export default function UnlockRequests({
    requests,
    validHours,
}: {
    requests: Paginated<Request>;
    validHours: number;
}) {
    const { t } = useTrans();
    const f = useFormat();

    const dateTime = (iso: string | null) =>
        iso ? `${f.date(iso.slice(0, 10))} ${iso.slice(11, 16)}` : '';
    const subjectLabel = (s: string) => {
        const [name, id] = s.split(' #');

        return `${t(name)} #${id}`;
    };

    const decide = (r: Request, decision: 'approved' | 'rejected') =>
        router.put(update(r.id), { decision }, { preserveScroll: true });

    const statusBadge = (r: Request) => {
        if (r.status === 'pending') {
            return (
                <Badge className="bg-amber-500 text-white">
                    {t('Pending')}
                </Badge>
            );
        }

        if (r.status === 'rejected') {
            return <Badge variant="outline">{t('Rejected')}</Badge>;
        }

        const open =
            r.expires_at !== null && new Date(r.expires_at) > new Date();

        return (
            <Badge
                className={open ? 'bg-emerald-600 text-white' : ''}
                variant={open ? 'default' : 'secondary'}
            >
                {open ? t('Unlocked') : t('Expired')}
            </Badge>
        );
    };

    return (
        <>
            <Head title={t('Unlock requests')} />
            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title={t('Unlock requests')}
                    description={t(
                        'Entries older than the edit limit are locked. When the manager needs to correct one, they ask here. An approved entry stays open for :hours hours.',
                        { hours: validHours },
                    )}
                />

                <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left text-xs text-muted-foreground uppercase">
                            <tr>
                                <th className="px-4 py-3 font-medium">
                                    {t('Asked on')}
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    {t('Entry')}
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    {t('Reason')}
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    {t('Status')}
                                </th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {requests.data.map((r) => (
                                <tr
                                    key={r.id}
                                    className="align-top hover:bg-muted/30"
                                >
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {dateTime(r.created_at)}
                                        <p className="text-xs text-muted-foreground">
                                            {r.requester}
                                        </p>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {subjectLabel(r.subject)}
                                    </td>
                                    <td className="px-4 py-3">{r.reason}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {statusBadge(r)}
                                        {r.decided_at && (
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {r.decider} ·{' '}
                                                {dateTime(r.decided_at)}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-2 py-2 text-right whitespace-nowrap">
                                        {r.status === 'pending' && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        decide(r, 'approved')
                                                    }
                                                >
                                                    <Check /> {t('Approve')}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        decide(r, 'rejected')
                                                    }
                                                >
                                                    <X /> {t('Reject')}
                                                </Button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {requests.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-4 py-10 text-center text-muted-foreground"
                                    >
                                        {t('No unlock requests.')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination page={requests} />
            </div>
        </>
    );
}

UnlockRequests.layout = {
    breadcrumbs: [{ title: 'Unlock requests', href: index() }],
};

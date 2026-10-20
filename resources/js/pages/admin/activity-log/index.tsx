import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { useTrans } from '@/hooks/use-trans';
import { index } from '@/routes/admin/activity-log';
import type { Paginated } from '@/types';

type Activity = {
    id: number;
    event: string;
    subject: string | null;
    properties: {
        old?: Record<string, unknown>;
        attributes?: Record<string, unknown>;
    } | null;
    user: { id: number; name: string } | null;
    ip_address: string | null;
    created_at: string;
};

const eventStyles: Record<string, string> = {
    created: 'bg-emerald-600 text-white',
    updated: 'bg-amber-500 text-white',
    deleted: 'bg-red-600 text-white',
    login: 'bg-sky-600 text-white',
    logout: 'bg-slate-500 text-white',
};

function formatValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
        return '—';
    }

    return typeof value === 'object'
        ? JSON.stringify(value)
        : String(value as string | number | boolean);
}

function Changes({ activity }: { activity: Activity }) {
    const attributes = activity.properties?.attributes;

    if (!attributes || Object.keys(attributes).length === 0) {
        return <span className="text-muted-foreground">—</span>;
    }

    const old = activity.properties?.old;

    return (
        <ul className="space-y-0.5 text-xs">
            {Object.entries(attributes).map(([key, value]) => (
                <li key={key}>
                    <span className="text-muted-foreground">{key}:</span>{' '}
                    {old && key in old && (
                        <>
                            <span className="line-through opacity-60">
                                {formatValue(old[key])}
                            </span>{' '}
                            →{' '}
                        </>
                    )}
                    <span className="font-medium">{formatValue(value)}</span>
                </li>
            ))}
        </ul>
    );
}

export default function ActivityLog({
    activities,
}: {
    activities: Paginated<Activity>;
}) {
    const { t, locale } = useTrans();
    const dateFormat = new Intl.DateTimeFormat(
        locale === 'bn' ? 'bn-BD' : 'en-GB',
        { dateStyle: 'medium', timeStyle: 'short' },
    );

    return (
        <>
            <Head title={t('Activity log')} />
            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title={t('Activity log')}
                    description={t(
                        'Every sign-in and every change made in the system, newest first.',
                    )}
                />

                <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left text-xs text-muted-foreground uppercase">
                            <tr>
                                <th className="px-4 py-3 font-medium">
                                    {t('When')}
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    {t('Who')}
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    {t('Action')}
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    {t('Record')}
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    {t('Changes')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y align-top">
                            {activities.data.map((a) => (
                                <tr key={a.id}>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {dateFormat.format(
                                            new Date(a.created_at),
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            {a.ip_address}
                                        </p>
                                    </td>
                                    <td className="px-4 py-3">
                                        {a.user?.name ?? t('System')}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge
                                            className={
                                                eventStyles[a.event] ?? ''
                                            }
                                        >
                                            {t(a.event)}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {a.subject ?? '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Changes activity={a} />
                                    </td>
                                </tr>
                            ))}
                            {activities.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-4 py-10 text-center text-muted-foreground"
                                    >
                                        {t('Nothing has been recorded yet.')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination page={activities} />
            </div>
        </>
    );
}

ActivityLog.layout = {
    breadcrumbs: [{ title: 'Activity log', href: index() }],
};

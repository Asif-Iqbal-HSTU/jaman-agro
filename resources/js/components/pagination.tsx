import { Link } from '@inertiajs/react';
import { useTrans } from '@/hooks/use-trans';
import { cn } from '@/lib/utils';
import type { Paginated } from '@/types';

export function Pagination({ page }: { page: Paginated<unknown> }) {
    const { t } = useTrans();

    if (page.last_page <= 1) {
        return null;
    }

    return (
        <nav className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <p className="text-muted-foreground">
                {t('Showing :from to :to of :total', {
                    from: page.from ?? 0,
                    to: page.to ?? 0,
                    total: page.total,
                })}
            </p>
            <div className="flex flex-wrap gap-1">
                {page.links.map((link, i) => {
                    const label = link.label
                        .replace('&laquo; Previous', '‹')
                        .replace('Next &raquo;', '›');

                    return link.url ? (
                        <Link
                            key={i}
                            href={link.url}
                            preserveScroll
                            className={cn(
                                'min-w-8 rounded-md border px-2.5 py-1 text-center',
                                link.active
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'hover:bg-muted',
                            )}
                        >
                            {label}
                        </Link>
                    ) : (
                        <span
                            key={i}
                            className="min-w-8 rounded-md border px-2.5 py-1 text-center text-muted-foreground opacity-50"
                        >
                            {label}
                        </span>
                    );
                })}
            </div>
        </nav>
    );
}

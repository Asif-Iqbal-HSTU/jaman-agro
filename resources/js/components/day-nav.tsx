import { Link, router } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTrans } from '@/hooks/use-trans';

export const shiftDate = (date: string, days: number) => {
    const d = new Date(`${date}T00:00:00`);
    d.setDate(d.getDate() + days);

    return [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, '0'),
        String(d.getDate()).padStart(2, '0'),
    ].join('-');
};

type Href = NonNullable<InertiaLinkProps['href']>;

/** Previous day / date picker / next day, for the day-sheet pages. */
export function DayNav({
    date,
    today,
    href,
}: {
    date: string;
    today: string;
    href: (date?: string) => Href;
}) {
    const { t } = useTrans();

    return (
        <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="icon" asChild>
                <Link
                    href={href(shiftDate(date, -1))}
                    aria-label={t('Previous day')}
                >
                    <ChevronLeft />
                </Link>
            </Button>
            <Input
                type="date"
                value={date}
                max={today}
                onChange={(e) =>
                    e.target.value && router.get(href(e.target.value))
                }
                className="w-44"
                aria-label={t('Date')}
            />
            <Button
                variant="outline"
                size="icon"
                disabled={date >= today}
                asChild={date < today}
            >
                {date < today ? (
                    <Link
                        href={href(shiftDate(date, 1))}
                        aria-label={t('Next day')}
                    >
                        <ChevronRight />
                    </Link>
                ) : (
                    <ChevronRight />
                )}
            </Button>
            {date !== today && (
                <Button variant="ghost" asChild>
                    <Link href={href()}>{t('Today')}</Link>
                </Button>
            )}
        </div>
    );
}

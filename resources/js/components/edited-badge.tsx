import { useTrans } from '@/hooks/use-trans';

/**
 * A small "edited" mark for a record changed after it was first saved,
 * like an edited WhatsApp message. Hover to see when.
 */
export function EditedBadge({ at }: { at?: string | null }) {
    const { t, locale } = useTrans();

    if (!at) {
        return null;
    }

    const when = new Intl.DateTimeFormat(locale === 'bn' ? 'bn-BD' : 'en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(at));

    return (
        <span
            title={t('Edited on :date', { date: when })}
            className="ml-1.5 inline-flex items-center rounded border border-amber-300 bg-amber-50 px-1 text-[10px] font-medium text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300"
        >
            {t('edited')}
        </span>
    );
}

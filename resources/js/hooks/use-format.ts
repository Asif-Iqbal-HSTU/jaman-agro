import { usePage } from '@inertiajs/react';
import { useMemo } from 'react';

type Numeric = string | number | null | undefined;

/**
 * Locale-aware formatting for weights, money and dates. Bangla shows
 * Bangla digits; both use South Asian (lakh / crore) digit grouping.
 */
export function useFormat() {
    const { locale } = usePage().props;

    return useMemo(() => {
        const tag = locale === 'bn' ? 'bn-BD' : 'en-IN';
        const decimal = new Intl.NumberFormat(tag, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        const integer = new Intl.NumberFormat(tag, {
            maximumFractionDigits: 0,
        });
        const date = new Intl.DateTimeFormat(tag, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
        const weekday = new Intl.DateTimeFormat(tag, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
        const shortDay = new Intl.DateTimeFormat(tag, {
            weekday: 'short',
            day: 'numeric',
        });
        // Lakh / crore aware short numbers for chart axes, e.g. 1.2L.
        const compact = new Intl.NumberFormat(tag, {
            notation: 'compact',
            maximumFractionDigits: 1,
        });
        const shortMonth = new Intl.DateTimeFormat(tag, { month: 'short' });
        const parseDate = (value: string) => new Date(`${value}T00:00:00`);

        return {
            number: (value: Numeric) => integer.format(Number(value ?? 0)),
            decimal: (value: Numeric) => decimal.format(Number(value ?? 0)),
            kg: (value: Numeric) => `${decimal.format(Number(value ?? 0))} kg`,
            money: (value: Numeric) =>
                `৳ ${decimal.format(Number(value ?? 0))}`,
            date: (value: string) => date.format(parseDate(value)),
            longDate: (value: string) => weekday.format(parseDate(value)),
            shortDay: (value: string) => shortDay.format(parseDate(value)),
            compact: (value: Numeric) => compact.format(Number(value ?? 0)),
            /** "2026-03" -> "Mar" */
            shortMonth: (yearMonth: string) =>
                shortMonth.format(parseDate(`${yearMonth}-01`)),
        };
    }, [locale]);
}

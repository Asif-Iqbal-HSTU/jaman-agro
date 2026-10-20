import { usePage } from '@inertiajs/react';
import { useCallback } from 'react';

export type Translate = (
    key: string,
    replace?: Record<string, string | number>,
) => string;

/**
 * Translate a string using the lang/{locale}.json strings shared by Laravel.
 * Keys are the English text, so an untranslated key falls back to English.
 * Placeholders use Laravel's `:name` syntax.
 */
export function useTrans(): { t: Translate; locale: string } {
    const { translations, locale } = usePage().props;

    const t = useCallback<Translate>(
        (key, replace = {}) =>
            Object.entries(replace).reduce(
                (text, [name, value]) =>
                    text.replaceAll(`:${name}`, String(value)),
                translations?.[key] ?? key,
            ),
        [translations],
    );

    return { t, locale };
}

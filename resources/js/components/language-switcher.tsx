import { router, usePage } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { update } from '@/routes/locale';
import type { Locale } from '@/types';

const locales: { value: Locale; label: string; title: string }[] = [
    { value: 'en', label: 'EN', title: 'English' },
    { value: 'bn', label: 'বাং', title: 'বাংলা' },
];

export function LanguageSwitcher({ className }: { className?: string }) {
    const { locale } = usePage().props;

    const switchTo = (value: Locale) => {
        if (value === locale) {
            return;
        }

        router.put(update(), { locale: value }, { preserveScroll: true });
    };

    return (
        <div
            role="group"
            aria-label="Language / ভাষা"
            className={cn(
                'inline-flex items-center rounded-full border border-border bg-background p-0.5 text-xs',
                className,
            )}
        >
            {locales.map((l) => (
                <button
                    key={l.value}
                    type="button"
                    title={l.title}
                    aria-pressed={locale === l.value}
                    onClick={() => switchTo(l.value)}
                    className={cn(
                        'rounded-full px-2.5 py-1 font-medium transition',
                        locale === l.value
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground',
                    )}
                >
                    {l.label}
                </button>
            ))}
        </div>
    );
}

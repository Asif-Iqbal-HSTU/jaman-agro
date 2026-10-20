import { Link } from '@inertiajs/react';
import { Leaf } from 'lucide-react';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useTrans } from '@/hooks/use-trans';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { t } = useTrans();

    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
            <LanguageSwitcher className="absolute top-4 right-4" />
            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <Link
                            href={home()}
                            className="flex flex-col items-center gap-2 font-medium"
                        >
                            <div className="mb-1 flex size-11 items-center justify-center rounded-full bg-[#1f4a2b] text-[#e8d7a6] dark:bg-[#b9d8ae] dark:text-[#10200f]">
                                <Leaf className="size-6" />
                            </div>
                            <span className="font-serif text-lg font-semibold">
                                {t('Jaman Agro')}
                            </span>
                        </Link>

                        <div className="space-y-2 text-center">
                            <h1 className="text-xl font-medium">
                                {title && t(title)}
                            </h1>
                            <p className="text-center text-sm text-muted-foreground">
                                {description && t(description)}
                            </p>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}

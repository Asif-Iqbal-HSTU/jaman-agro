import { usePage } from '@inertiajs/react';
import { Leaf } from 'lucide-react';
import { useTrans } from '@/hooks/use-trans';

export default function AppLogo() {
    const { name } = usePage().props;
    const { t } = useTrans();

    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-[#1f4a2b] text-[#e8d7a6] dark:bg-[#b9d8ae] dark:text-[#10200f]">
                <Leaf className="size-4.5" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="truncate leading-tight font-semibold">
                    {t(name)}
                </span>
                <span className="truncate text-[11px] leading-tight text-muted-foreground">
                    {t('Tea Factory')}
                </span>
            </div>
        </>
    );
}

import { useFormat } from '@/hooks/use-format';
import { useTrans } from '@/hooks/use-trans';
import { cn } from '@/lib/utils';

/**
 * An account balance. For a supplier, positive is what the factory owes them
 * and negative an advance they still have to work off with leaf. For a
 * customer, positive is what they owe (label "due") and negative an advance.
 */
export function Balance({
    value,
    className,
    withLabel = false,
    positiveLabel = 'payable',
}: {
    value: string;
    className?: string;
    withLabel?: boolean;
    positiveLabel?: string;
}) {
    const { t } = useTrans();
    const f = useFormat();
    const amount = Number(value);

    return (
        <span
            className={cn(
                'tabular-nums',
                amount < 0 && 'text-amber-700 dark:text-amber-400',
                className,
            )}
        >
            {f.money(Math.abs(amount))}
            {amount < 0 && (
                <span className="ml-1 text-xs font-normal">
                    ({t('advance')})
                </span>
            )}
            {withLabel && amount > 0 && (
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                    ({t(positiveLabel)})
                </span>
            )}
        </span>
    );
}

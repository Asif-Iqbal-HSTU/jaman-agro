import { Badge } from '@/components/ui/badge';
import { useTrans } from '@/hooks/use-trans';
import type { InvoiceStatus as Status } from '@/types';

const styles: Record<Status, string> = {
    packed: 'bg-slate-500 text-white',
    dispatched: 'bg-sky-600 text-white',
    sold: 'bg-amber-500 text-white',
    paid: 'bg-emerald-600 text-white',
};

export const statusLabels: Record<Status, string> = {
    packed: 'Packed',
    dispatched: 'Dispatched',
    sold: 'Sold, payment due',
    paid: 'Paid',
};

export function InvoiceStatus({ status }: { status: Status }) {
    const { t } = useTrans();

    return <Badge className={styles[status]}>{t(statusLabels[status])}</Badge>;
}

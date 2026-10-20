import { Link, router, usePage } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import { Hourglass, Lock, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useTrans } from '@/hooks/use-trans';
import { store as requestUnlock } from '@/routes/unlock-requests';
import type { EditLockState } from '@/types';

export type LockSubject =
    | 'leaf_receipt'
    | 'leaf_rate'
    | 'supplier_payment'
    | 'production_batch'
    | 'auction_invoice'
    | 'retail_sale'
    | 'customer_payment'
    | 'expense'
    | 'attendance'
    | 'piece_work';

type Props = {
    lock?: EditLockState;
    subject: LockSubject;
    id: number;
    editHref?: NonNullable<InertiaLinkProps['href']>;
    onDelete?: () => void;
};

/**
 * Edit and delete buttons for a record — or, once the record is past the
 * edit time limit, a lock that lets the manager ask the admin to unlock it.
 */
export function RecordActions({
    lock = 'open',
    subject,
    id,
    editHref,
    onDelete,
}: Props) {
    const { t } = useTrans();

    if (lock === 'pending') {
        return (
            <span
                className="inline-flex items-center gap-1 px-2 text-xs text-muted-foreground"
                title={t('Unlock requested — waiting for the administrator.')}
            >
                <Hourglass className="size-4" /> {t('Waiting')}
            </span>
        );
    }

    if (lock === 'locked') {
        return <UnlockButton subject={subject} id={id} />;
    }

    return (
        <span className="inline-flex items-center">
            {editHref && (
                <Button variant="ghost" size="icon" asChild>
                    <Link href={editHref} aria-label={t('Edit')}>
                        <Pencil />
                    </Link>
                </Button>
            )}
            {onDelete && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onDelete}
                    aria-label={t('Delete')}
                >
                    <Trash2 className="text-destructive" />
                </Button>
            )}
        </span>
    );
}

export function UnlockButton({
    subject,
    id,
}: {
    subject: LockSubject;
    id: number;
}) {
    const { t } = useTrans();
    const { editLockDays } = usePage().props;
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState('');
    const [processing, setProcessing] = useState(false);

    const submit = () => {
        router.post(
            requestUnlock(),
            { subject, id, reason },
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: () => {
                    setOpen(false);
                    setReason('');
                },
            },
        );
    };

    return (
        <>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(true)}
                title={t('Locked: older than :days days', {
                    days: editLockDays,
                })}
            >
                <Lock className="size-4" /> {t('Locked')}
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {t('Ask to unlock this entry')}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'Entries can be changed for :days days. After that the administrator has to approve the change. Say what needs correcting.',
                                { days: editLockDays },
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        maxLength={255}
                        placeholder={t(
                            'e.g. Wrong weight entered, should be 412 kg',
                        )}
                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
                    />
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setOpen(false)}>
                            {t('Cancel')}
                        </Button>
                        <Button
                            onClick={submit}
                            disabled={processing || reason.trim() === ''}
                        >
                            {t('Send request')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

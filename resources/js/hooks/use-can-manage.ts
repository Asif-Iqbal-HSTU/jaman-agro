import { usePage } from '@inertiajs/react';

/**
 * Whether the signed-in user may record or change factory entries.
 * The owner has read-only access.
 */
export function useCanManage(): boolean {
    const { auth } = usePage().props;

    return auth.user.role === 'admin' || auth.user.role === 'manager';
}

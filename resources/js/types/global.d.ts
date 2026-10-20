import type { Auth, Locale } from '@/types/auth';

declare module 'react' {
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            locale: Locale;
            translations: Record<string, string>;
            pendingUnlocks: number;
            editLockDays: number;
            [key: string]: unknown;
        };
    }
}

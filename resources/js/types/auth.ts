export type UserRole = 'admin' | 'manager' | 'owner';

export type Locale = 'en' | 'bn';

export type User = {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    locale: Locale;
    is_active: boolean;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
};

export type RoleOption = {
    value: UserRole;
    label: string;
};

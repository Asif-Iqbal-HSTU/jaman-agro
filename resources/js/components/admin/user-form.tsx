import { Form, Link } from '@inertiajs/react';
import type { ComponentProps } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useTrans } from '@/hooks/use-trans';
import { index } from '@/routes/admin/users';
import type { RoleOption, User } from '@/types';

type Props = {
    form: Pick<ComponentProps<typeof Form>, 'action' | 'method'>;
    roles: RoleOption[];
    passwordRules: string;
    user?: User;
};

export function UserForm({ form, roles, passwordRules, user }: Props) {
    const { t } = useTrans();
    const editing = user !== undefined;

    return (
        <Form
            {...form}
            resetOnSuccess={
                editing ? ['password', 'password_confirmation'] : true
            }
            className="max-w-xl space-y-6"
        >
            {({ processing, errors }) => (
                <>
                    <div className="grid gap-2">
                        <Label htmlFor="name">{t('Full name')}</Label>
                        <Input
                            id="name"
                            name="name"
                            defaultValue={user?.name}
                            required
                            autoComplete="off"
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">{t('Email address')}</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            defaultValue={user?.email}
                            required
                            autoComplete="off"
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-6 sm:grid-cols-3">
                        <div className="grid gap-2">
                            <Label htmlFor="role">{t('Role')}</Label>
                            <Select
                                name="role"
                                defaultValue={user?.role ?? 'manager'}
                            >
                                <SelectTrigger id="role" className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map((role) => (
                                        <SelectItem
                                            key={role.value}
                                            value={role.value}
                                        >
                                            {role.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.role} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="locale">{t('Language')}</Label>
                            <Select
                                name="locale"
                                defaultValue={user?.locale ?? 'bn'}
                            >
                                <SelectTrigger id="locale" className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="bn">বাংলা</SelectItem>
                                    <SelectItem value="en">English</SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={errors.locale} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="is_active">{t('Status')}</Label>
                            <Select
                                name="is_active"
                                defaultValue={
                                    user === undefined || user.is_active
                                        ? '1'
                                        : '0'
                                }
                            >
                                <SelectTrigger
                                    id="is_active"
                                    className="w-full"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">
                                        {t('Active')}
                                    </SelectItem>
                                    <SelectItem value="0">
                                        {t('Inactive')}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={errors.is_active} />
                        </div>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="password">
                                {editing ? t('New password') : t('Password')}
                            </Label>
                            <PasswordInput
                                id="password"
                                name="password"
                                required={!editing}
                                autoComplete="new-password"
                                passwordrules={passwordRules}
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">
                                {t('Confirm password')}
                            </Label>
                            <PasswordInput
                                id="password_confirmation"
                                name="password_confirmation"
                                required={!editing}
                                autoComplete="new-password"
                            />
                        </div>
                    </div>
                    {editing && (
                        <p className="-mt-3 text-xs text-muted-foreground">
                            {t(
                                'Leave the password empty to keep it unchanged.',
                            )}
                        </p>
                    )}

                    <div className="flex items-center gap-3">
                        <Button disabled={processing} data-test="save-user">
                            {processing && <Spinner />}
                            {editing ? t('Save changes') : t('Create account')}
                        </Button>
                        <Button variant="ghost" asChild>
                            <Link href={index()}>{t('Cancel')}</Link>
                        </Button>
                    </div>
                </>
            )}
        </Form>
    );
}

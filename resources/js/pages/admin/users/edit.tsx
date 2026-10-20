import { Head } from '@inertiajs/react';
import UserController from '@/actions/App/Http/Controllers/Admin/UserController';
import { UserForm } from '@/components/admin/user-form';
import Heading from '@/components/heading';
import { useTrans } from '@/hooks/use-trans';
import { index } from '@/routes/admin/users';
import type { RoleOption, User } from '@/types';

type Props = {
    user: User;
    roles: RoleOption[];
    passwordRules: string;
};

export default function EditUser({ user, roles, passwordRules }: Props) {
    const { t } = useTrans();

    return (
        <>
            <Head title={t('Edit account')} />
            <div className="p-4 md:p-6">
                <Heading title={t('Edit account')} description={user.email} />
                <UserForm
                    form={UserController.update.form(user)}
                    roles={roles}
                    passwordRules={passwordRules}
                    user={user}
                />
            </div>
        </>
    );
}

EditUser.layout = {
    breadcrumbs: [{ title: 'Users', href: index() }],
};

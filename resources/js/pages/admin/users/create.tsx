import { Head } from '@inertiajs/react';
import UserController from '@/actions/App/Http/Controllers/Admin/UserController';
import { UserForm } from '@/components/admin/user-form';
import Heading from '@/components/heading';
import { useTrans } from '@/hooks/use-trans';
import { create, index } from '@/routes/admin/users';
import type { RoleOption } from '@/types';

type Props = {
    roles: RoleOption[];
    passwordRules: string;
};

export default function CreateUser({ roles, passwordRules }: Props) {
    const { t } = useTrans();

    return (
        <>
            <Head title={t('New account')} />
            <div className="p-4 md:p-6">
                <Heading
                    title={t('New account')}
                    description={t(
                        'Create a login for someone at the factory and choose what they can do.',
                    )}
                />
                <UserForm
                    form={UserController.store.form()}
                    roles={roles}
                    passwordRules={passwordRules}
                />
            </div>
        </>
    );
}

CreateUser.layout = {
    breadcrumbs: [
        { title: 'Users', href: index() },
        { title: 'New account', href: create() },
    ],
};

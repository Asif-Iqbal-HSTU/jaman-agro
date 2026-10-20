import { Form, Head, Link, usePage } from '@inertiajs/react';
import { Pencil, Plus, Search } from 'lucide-react';
import Heading from '@/components/heading';
import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTrans } from '@/hooks/use-trans';
import { create, edit, index } from '@/routes/admin/users';
import type { Paginated, RoleOption, User } from '@/types';

type Props = {
    users: Paginated<User>;
    filters: { search: string };
    roles: RoleOption[];
};

export default function Users({ users, filters, roles }: Props) {
    const { t } = useTrans();
    const { auth } = usePage().props;
    const roleLabel = (value: string) =>
        roles.find((r) => r.value === value)?.label ?? value;

    return (
        <>
            <Head title={t('Users')} />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title={t('Users')}
                        description={t(
                            'Everyone who can sign in to the factory system.',
                        )}
                    />
                    <Button asChild>
                        <Link href={create()}>
                            <Plus /> {t('New account')}
                        </Link>
                    </Button>
                </div>

                <Form
                    {...index.form()}
                    options={{ preserveState: true }}
                    className="flex max-w-sm gap-2"
                >
                    <Input
                        name="search"
                        defaultValue={filters.search}
                        placeholder={t('Search by name or email')}
                    />
                    <Button
                        type="submit"
                        variant="outline"
                        size="icon"
                        aria-label={t('Search')}
                    >
                        <Search />
                    </Button>
                </Form>

                <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left text-xs text-muted-foreground uppercase">
                            <tr>
                                <th className="px-4 py-3 font-medium">
                                    {t('Name')}
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    {t('Role')}
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    {t('Language')}
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    {t('Status')}
                                </th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {users.data.map((user) => (
                                <tr key={user.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3">
                                        <p className="font-medium">
                                            {user.name}
                                            {user.id === auth.user.id && (
                                                <span className="ml-2 text-xs text-muted-foreground">
                                                    ({t('you')})
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {user.email}
                                        </p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant="secondary">
                                            {roleLabel(user.role)}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        {user.locale === 'bn'
                                            ? 'বাংলা'
                                            : 'English'}
                                    </td>
                                    <td className="px-4 py-3">
                                        {user.is_active ? (
                                            <Badge className="bg-emerald-600 text-white">
                                                {t('Active')}
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline">
                                                {t('Inactive')}
                                            </Badge>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            asChild
                                        >
                                            <Link href={edit(user)}>
                                                <Pencil /> {t('Edit')}
                                            </Link>
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {users.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-4 py-10 text-center text-muted-foreground"
                                    >
                                        {t('No accounts found.')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination page={users} />
            </div>
        </>
    );
}

Users.layout = {
    breadcrumbs: [{ title: 'Users', href: index() }],
};

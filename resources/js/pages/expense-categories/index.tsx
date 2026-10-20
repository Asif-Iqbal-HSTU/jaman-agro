import { Form, Head } from '@inertiajs/react';
import ExpenseCategoryController from '@/actions/App/Http/Controllers/ExpenseCategoryController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { NativeSelect } from '@/components/native-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTrans } from '@/hooks/use-trans';
import { index } from '@/routes/expense-categories';
import type { Option } from '@/types';

type Category = {
    id: number;
    name: string;
    kind: 'factory' | 'vehicle';
    sort_order: number;
    is_active: boolean;
    updated_at?: string;
};

function CategoryRow({
    category,
    kinds,
}: {
    category?: Category;
    kinds: Option[];
}) {
    const { t } = useTrans();
    const form = category
        ? ExpenseCategoryController.update.form(category.id)
        : ExpenseCategoryController.store.form();

    return (
        <Form
            {...form}
            options={{ preserveScroll: true }}
            resetOnSuccess={!category}
            className="grid items-start gap-2 border-b p-3 last:border-b-0 sm:grid-cols-[1fr_8rem_6rem_8rem_auto]"
        >
            {({ processing, errors, isDirty }) => (
                <>
                    <div>
                        <Input
                            name="name"
                            defaultValue={category?.name}
                            placeholder={t('Category name')}
                            aria-label={t('Category name')}
                            required
                        />
                        {category && t(category.name) !== category.name && (
                            <p className="mt-1 text-xs text-muted-foreground">
                                {t(category.name)}
                            </p>
                        )}
                        <InputError message={errors.name} />
                    </div>
                    <div>
                        <NativeSelect
                            name="kind"
                            defaultValue={category?.kind ?? 'factory'}
                            aria-label={t('Kind')}
                        >
                            {kinds.map((k) => (
                                <option key={k.value} value={k.value}>
                                    {k.label}
                                </option>
                            ))}
                        </NativeSelect>
                        <InputError message={errors.kind} />
                    </div>
                    <div>
                        <Input
                            name="sort_order"
                            type="number"
                            min="0"
                            defaultValue={category?.sort_order ?? ''}
                            placeholder={t('Order')}
                            aria-label={t('Order')}
                        />
                        <InputError message={errors.sort_order} />
                    </div>
                    <NativeSelect
                        name="is_active"
                        defaultValue={
                            category && !category.is_active ? '0' : '1'
                        }
                        aria-label={t('Status')}
                    >
                        <option value="1">{t('Active')}</option>
                        <option value="0">{t('Inactive')}</option>
                    </NativeSelect>
                    <Button
                        variant={category ? 'outline' : 'default'}
                        disabled={
                            processing || (category !== undefined && !isDirty)
                        }
                    >
                        {category ? t('Save') : t('Add category')}
                    </Button>
                </>
            )}
        </Form>
    );
}

export default function ExpenseCategories({
    categories,
    kinds,
}: {
    categories: Category[];
    kinds: Option[];
}) {
    const { t } = useTrans();

    return (
        <>
            <Head title={t('Expense categories')} />
            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title={t('Expense categories')}
                    description={t(
                        'The headings expenses are booked under, for the factory or for its vehicles. Vehicle costs count as the cost of bringing leaf in. Switch off one you no longer use instead of deleting it.',
                    )}
                />
                <div className="max-w-3xl rounded-xl border">
                    {categories.map((c) => (
                        <CategoryRow
                            key={`${c.id}-${c.updated_at ?? ''}`}
                            category={c}
                            kinds={kinds}
                        />
                    ))}
                </div>
                <div className="max-w-3xl">
                    <h2 className="mb-2 text-sm font-medium">
                        {t('New category')}
                    </h2>
                    <div className="rounded-xl border border-dashed">
                        <CategoryRow kinds={kinds} />
                    </div>
                </div>
            </div>
        </>
    );
}

ExpenseCategories.layout = {
    breadcrumbs: [{ title: 'Expense categories', href: index() }],
};

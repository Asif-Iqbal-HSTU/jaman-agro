import { Form, Head } from '@inertiajs/react';
import TeaGradeController from '@/actions/App/Http/Controllers/TeaGradeController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { NativeSelect } from '@/components/native-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTrans } from '@/hooks/use-trans';
import { index } from '@/routes/grades';
import type { TeaGrade } from '@/types';

function GradeRow({ grade }: { grade?: TeaGrade }) {
    const { t } = useTrans();
    const form = grade
        ? TeaGradeController.update.form(grade.id)
        : TeaGradeController.store.form();

    return (
        <Form
            {...form}
            options={{ preserveScroll: true }}
            resetOnSuccess={!grade}
            className="grid grid-cols-[5rem_1fr] items-start gap-2 border-b p-3 last:border-b-0 sm:grid-cols-[6rem_1fr_6rem_8rem_auto]"
        >
            {({ processing, errors, isDirty }) => (
                <>
                    <div>
                        <Input
                            name="code"
                            defaultValue={grade?.code}
                            placeholder={t('Code')}
                            aria-label={t('Code')}
                            required
                            className="font-semibold"
                        />
                        <InputError message={errors.code} />
                    </div>
                    <div>
                        <Input
                            name="name"
                            defaultValue={grade?.name ?? ''}
                            placeholder={t('Full name')}
                            aria-label={t('Full name')}
                        />
                        <InputError message={errors.name} />
                    </div>
                    <div>
                        <Input
                            name="sort_order"
                            type="number"
                            min="0"
                            defaultValue={grade?.sort_order ?? ''}
                            placeholder={t('Order')}
                            aria-label={t('Order')}
                        />
                        <InputError message={errors.sort_order} />
                    </div>
                    <NativeSelect
                        name="is_active"
                        defaultValue={grade && !grade.is_active ? '0' : '1'}
                        aria-label={t('Status')}
                    >
                        <option value="1">{t('Active')}</option>
                        <option value="0">{t('Inactive')}</option>
                    </NativeSelect>
                    <Button
                        variant={grade ? 'outline' : 'default'}
                        disabled={
                            processing || (grade !== undefined && !isDirty)
                        }
                    >
                        {grade ? t('Save') : t('Add grade')}
                    </Button>
                </>
            )}
        </Form>
    );
}

export default function Grades({ grades }: { grades: TeaGrade[] }) {
    const { t } = useTrans();

    return (
        <>
            <Head title={t('Tea grades')} />
            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title={t('Tea grades')}
                    description={t(
                        'The grades made tea is sorted into. Switch off a grade you no longer make instead of deleting it.',
                    )}
                />

                <div className="max-w-4xl rounded-xl border">
                    {grades.map((g) => (
                        <GradeRow
                            key={`${g.id}-${g.updated_at as string}`}
                            grade={g}
                        />
                    ))}
                </div>

                <div className="max-w-4xl">
                    <h2 className="mb-2 text-sm font-medium">
                        {t('New grade')}
                    </h2>
                    <div className="rounded-xl border border-dashed">
                        <GradeRow />
                    </div>
                </div>
            </div>
        </>
    );
}

Grades.layout = {
    breadcrumbs: [{ title: 'Tea grades', href: index() }],
};

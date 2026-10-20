import { Form, Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import StockController from '@/actions/App/Http/Controllers/StockController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { NativeSelect } from '@/components/native-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useFormat } from '@/hooks/use-format';
import { useTrans } from '@/hooks/use-trans';
import { adjust, index } from '@/routes/stock';
import type { TeaGrade } from '@/types';

type Props = {
    grades: TeaGrade[];
    balances: Record<string, string>;
    today: string;
};

export default function AdjustStock({ grades, balances, today }: Props) {
    const { t } = useTrans();
    const f = useFormat();
    const [gradeId, setGradeId] = useState('');

    return (
        <>
            <Head title={t('Adjust stock')} />
            <div className="p-4 md:p-6">
                <Heading
                    title={t('Adjust stock')}
                    description={t(
                        'Correct the stock after a recount, damage or samples. Always give the reason.',
                    )}
                />

                <Form
                    {...StockController.storeAdjustment.form()}
                    className="max-w-2xl space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="moved_on">
                                        {t('Date')}
                                    </Label>
                                    <Input
                                        id="moved_on"
                                        name="moved_on"
                                        type="date"
                                        defaultValue={today}
                                        required
                                    />
                                    <InputError message={errors.moved_on} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="tea_grade_id">
                                        {t('Grade')}
                                    </Label>
                                    <NativeSelect
                                        id="tea_grade_id"
                                        name="tea_grade_id"
                                        value={gradeId}
                                        onChange={(e) =>
                                            setGradeId(e.target.value)
                                        }
                                        required
                                    >
                                        <option value="">
                                            {t('Choose a grade')}
                                        </option>
                                        {grades.map((g) => (
                                            <option key={g.id} value={g.id}>
                                                {g.code}
                                                {g.name ? ` · ${g.name}` : ''}
                                            </option>
                                        ))}
                                    </NativeSelect>
                                    {gradeId && (
                                        <p className="text-xs text-muted-foreground">
                                            {t('In stock now: :kg', {
                                                kg: f.kg(
                                                    balances[gradeId] ?? 0,
                                                ),
                                            })}
                                        </p>
                                    )}
                                    <InputError message={errors.tea_grade_id} />
                                </div>
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="direction">
                                        {t('Adjustment')}
                                    </Label>
                                    <NativeSelect
                                        id="direction"
                                        name="direction"
                                        defaultValue="remove"
                                    >
                                        <option value="remove">
                                            {t('Remove from stock')}
                                        </option>
                                        <option value="add">
                                            {t('Add to stock')}
                                        </option>
                                    </NativeSelect>
                                    <InputError message={errors.direction} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="quantity_kg">
                                        {t('Quantity (kg)')}
                                    </Label>
                                    <Input
                                        id="quantity_kg"
                                        name="quantity_kg"
                                        type="number"
                                        inputMode="decimal"
                                        step="0.01"
                                        min="0"
                                        required
                                    />
                                    <InputError message={errors.quantity_kg} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="reason">{t('Reason')}</Label>
                                <Input
                                    id="reason"
                                    name="reason"
                                    required
                                    placeholder={t(
                                        'e.g. Monthly recount, samples sent to broker',
                                    )}
                                />
                                <InputError message={errors.reason} />
                                <InputError message={errors.outputs} />
                            </div>

                            <div className="flex items-center gap-3">
                                <Button disabled={processing}>
                                    {processing && <Spinner />}
                                    {t('Save adjustment')}
                                </Button>
                                <Button variant="ghost" asChild>
                                    <Link href={index()}>{t('Cancel')}</Link>
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

AdjustStock.layout = {
    breadcrumbs: [
        { title: 'Made tea stock', href: index() },
        { title: 'Adjust stock', href: adjust() },
    ],
};

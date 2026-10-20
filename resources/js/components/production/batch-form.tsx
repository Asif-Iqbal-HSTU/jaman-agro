import { Link, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useFormat } from '@/hooks/use-format';
import { useTrans } from '@/hooks/use-trans';
import { cn } from '@/lib/utils';
import { index, store, update } from '@/routes/production';
import type { ProductionBatch, TeaGrade } from '@/types';

type Props = {
    grades: TeaGrade[];
    leafReceived: Record<string, string>;
    batch?: ProductionBatch;
    date?: string;
};

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function BatchForm({ grades, leafReceived, batch, date }: Props) {
    const { t } = useTrans();
    const f = useFormat();

    const initialDate = batch?.produced_on ?? date ?? '';
    const form = useForm({
        produced_on: initialDate,
        green_leaf_kg: batch?.green_leaf_kg ?? leafReceived[initialDate] ?? '',
        withering_hours: batch?.withering_hours ?? '',
        fermentation_minutes: String(batch?.fermentation_minutes ?? ''),
        dryer_temp_c: String(batch?.dryer_temp_c ?? ''),
        notes: batch?.notes ?? '',
        outputs: Object.fromEntries(
            grades.map((g) => [String(g.id), batch?.outputs[g.id] ?? '']),
        ) as Record<string, string>,
    });
    const { data, setData, errors, processing } = form;

    const madeTea = round2(
        Object.values(data.outputs).reduce(
            (sum, kg) => sum + Number(kg || 0),
            0,
        ),
    );
    const greenLeaf = Number(data.green_leaf_kg || 0);
    const recovery = greenLeaf > 0 ? round2((madeTea * 100) / greenLeaf) : null;
    const received = leafReceived[data.produced_on];

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.submit(batch ? update(batch.id) : store());
    };

    return (
        <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_18rem]">
            <div className="space-y-8">
                <section className="space-y-6">
                    <div className="grid gap-6 sm:grid-cols-[12rem_1fr]">
                        <div className="grid gap-2">
                            <Label htmlFor="produced_on">{t('Date')}</Label>
                            <Input
                                id="produced_on"
                                type="date"
                                value={data.produced_on}
                                onChange={(e) =>
                                    setData('produced_on', e.target.value)
                                }
                                required
                            />
                            <InputError message={errors.produced_on} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="green_leaf_kg">
                                {t('Green leaf used (kg)')}
                            </Label>
                            <Input
                                id="green_leaf_kg"
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                min="0"
                                value={data.green_leaf_kg}
                                onChange={(e) =>
                                    setData('green_leaf_kg', e.target.value)
                                }
                                required
                                className="text-lg"
                            />
                            {received && (
                                <p className="text-xs text-muted-foreground">
                                    {t('Net leaf received that day: :kg', {
                                        kg: f.kg(received),
                                    })}{' '}
                                    {received !== data.green_leaf_kg && (
                                        <button
                                            type="button"
                                            className="text-primary hover:underline"
                                            onClick={() =>
                                                setData(
                                                    'green_leaf_kg',
                                                    received,
                                                )
                                            }
                                        >
                                            {t('Use this')}
                                        </button>
                                    )}
                                </p>
                            )}
                            <InputError message={errors.green_leaf_kg} />
                        </div>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-3">
                        <div className="grid gap-2">
                            <Label htmlFor="withering_hours">
                                {t('Withering (hours)')}
                            </Label>
                            <Input
                                id="withering_hours"
                                type="number"
                                step="0.1"
                                min="0"
                                value={data.withering_hours}
                                onChange={(e) =>
                                    setData('withering_hours', e.target.value)
                                }
                                placeholder={t('Optional')}
                            />
                            <InputError message={errors.withering_hours} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="fermentation_minutes">
                                {t('Fermentation (minutes)')}
                            </Label>
                            <Input
                                id="fermentation_minutes"
                                type="number"
                                step="1"
                                min="0"
                                value={data.fermentation_minutes}
                                onChange={(e) =>
                                    setData(
                                        'fermentation_minutes',
                                        e.target.value,
                                    )
                                }
                                placeholder={t('Optional')}
                            />
                            <InputError message={errors.fermentation_minutes} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="dryer_temp_c">
                                {t('Dryer temperature (°C)')}
                            </Label>
                            <Input
                                id="dryer_temp_c"
                                type="number"
                                step="1"
                                min="0"
                                value={data.dryer_temp_c}
                                onChange={(e) =>
                                    setData('dryer_temp_c', e.target.value)
                                }
                                placeholder={t('Optional')}
                            />
                            <InputError message={errors.dryer_temp_c} />
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="mb-1 font-medium">
                        {t('Made tea by grade (kg)')}
                    </h2>
                    <p className="mb-4 text-sm text-muted-foreground">
                        {t('Leave a grade empty if none was made.')}
                    </p>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        {grades.map((g) => (
                            <div key={g.id} className="grid gap-1.5">
                                <Label
                                    htmlFor={`grade-${g.id}`}
                                    title={g.name ?? undefined}
                                >
                                    {g.code}
                                </Label>
                                <Input
                                    id={`grade-${g.id}`}
                                    type="number"
                                    inputMode="decimal"
                                    step="0.01"
                                    min="0"
                                    value={data.outputs[g.id] ?? ''}
                                    onChange={(e) =>
                                        setData('outputs', {
                                            ...data.outputs,
                                            [g.id]: e.target.value,
                                        })
                                    }
                                />
                                <InputError
                                    message={
                                        (errors as Record<string, string>)[
                                            `outputs.${g.id}`
                                        ]
                                    }
                                />
                            </div>
                        ))}
                    </div>
                    <InputError message={errors.outputs} className="mt-3" />
                </section>

                <div className="grid gap-2">
                    <Label htmlFor="notes">{t('Notes')}</Label>
                    <Input
                        id="notes"
                        value={data.notes}
                        onChange={(e) => setData('notes', e.target.value)}
                        placeholder={t('Optional')}
                    />
                    <InputError message={errors.notes} />
                </div>

                <div className="flex items-center gap-3">
                    <Button type="submit" disabled={processing}>
                        {processing && <Spinner />}
                        {batch ? t('Save changes') : t('Save batch')}
                    </Button>
                    <Button variant="ghost" asChild>
                        <Link href={index()}>{t('Cancel')}</Link>
                    </Button>
                </div>
            </div>

            <aside className="h-fit space-y-3 rounded-xl border bg-muted/30 p-5 text-sm lg:sticky lg:top-4">
                <p className="font-medium">{t('Out-turn')}</p>
                <dl className="space-y-2">
                    <div className="flex justify-between">
                        <dt className="text-muted-foreground">
                            {t('Green leaf used')}
                        </dt>
                        <dd className="whitespace-nowrap tabular-nums">
                            {f.kg(greenLeaf)}
                        </dd>
                    </div>
                    <div className="flex justify-between text-base font-semibold">
                        <dt>{t('Made tea')}</dt>
                        <dd className="whitespace-nowrap tabular-nums">
                            {f.kg(madeTea)}
                        </dd>
                    </div>
                    <div className="flex justify-between border-t pt-2 text-base font-semibold">
                        <dt>{t('Recovery')}</dt>
                        <dd
                            className={cn(
                                'tabular-nums',
                                recovery !== null &&
                                    (recovery < 15 || recovery > 30) &&
                                    'text-amber-700 dark:text-amber-400',
                            )}
                        >
                            {recovery === null
                                ? '—'
                                : `${f.decimal(recovery)}%`}
                        </dd>
                    </div>
                </dl>
                {recovery !== null && (recovery < 15 || recovery > 30) && (
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                        {t(
                            'CTC recovery is usually between 20% and 24%. Please check the figures.',
                        )}
                    </p>
                )}
            </aside>
        </form>
    );
}

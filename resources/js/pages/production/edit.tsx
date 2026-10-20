import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import { BatchForm } from '@/components/production/batch-form';
import { useFormat } from '@/hooks/use-format';
import { useTrans } from '@/hooks/use-trans';
import { index } from '@/routes/production';
import type { ProductionBatch, TeaGrade } from '@/types';

type Props = {
    grades: TeaGrade[];
    leafReceived: Record<string, string>;
    batch: ProductionBatch;
};

export default function EditBatch(props: Props) {
    const { t } = useTrans();
    const f = useFormat();

    return (
        <>
            <Head title={t('Correct production')} />
            <div className="p-4 md:p-6">
                <Heading
                    title={t('Correct production')}
                    description={f.longDate(props.batch.produced_on)}
                />
                <BatchForm {...props} />
            </div>
        </>
    );
}

EditBatch.layout = {
    breadcrumbs: [{ title: 'Production', href: index() }],
};

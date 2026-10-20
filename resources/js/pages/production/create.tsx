import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import { BatchForm } from '@/components/production/batch-form';
import { useTrans } from '@/hooks/use-trans';
import { create, index } from '@/routes/production';
import type { TeaGrade } from '@/types';

type Props = {
    grades: TeaGrade[];
    leafReceived: Record<string, string>;
    date: string;
};

export default function CreateBatch(props: Props) {
    const { t } = useTrans();

    return (
        <>
            <Head title={t('Record production')} />
            <div className="p-4 md:p-6">
                <Heading
                    title={t('Record production')}
                    description={t(
                        'Green leaf that went in and the made tea sorted out of it.',
                    )}
                />
                <BatchForm {...props} />
            </div>
        </>
    );
}

CreateBatch.layout = {
    breadcrumbs: [
        { title: 'Production', href: index() },
        { title: 'Record production', href: create() },
    ],
};

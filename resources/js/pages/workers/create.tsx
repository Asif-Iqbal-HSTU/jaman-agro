import { Head } from '@inertiajs/react';
import WorkerController from '@/actions/App/Http/Controllers/WorkerController';
import Heading from '@/components/heading';
import { WorkerForm } from '@/components/workers/worker-form';
import { useTrans } from '@/hooks/use-trans';
import { create, index } from '@/routes/workers';
import type { Option } from '@/types';

export default function CreateWorker({ payTypes }: { payTypes: Option[] }) {
    const { t } = useTrans();

    return (
        <>
            <Head title={t('Add worker')} />
            <div className="p-4 md:p-6">
                <Heading
                    title={t('Add worker')}
                    description={t(
                        'A daily worker paid by the hour or for contract work.',
                    )}
                />
                <WorkerForm
                    form={WorkerController.store.form()}
                    payTypes={payTypes}
                />
            </div>
        </>
    );
}

CreateWorker.layout = {
    breadcrumbs: [
        { title: 'Workers', href: index() },
        { title: 'Add worker', href: create() },
    ],
};

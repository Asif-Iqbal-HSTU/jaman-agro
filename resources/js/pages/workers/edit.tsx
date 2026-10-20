import { Head } from '@inertiajs/react';
import WorkerController from '@/actions/App/Http/Controllers/WorkerController';
import Heading from '@/components/heading';
import { WorkerForm } from '@/components/workers/worker-form';
import { useTrans } from '@/hooks/use-trans';
import { index } from '@/routes/workers';
import type { Option, Worker } from '@/types';

export default function EditWorker({
    worker,
    payTypes,
}: {
    worker: Worker;
    payTypes: Option[];
}) {
    const { t } = useTrans();

    return (
        <>
            <Head title={t('Edit worker')} />
            <div className="p-4 md:p-6">
                <Heading title={t('Edit worker')} description={worker.name} />
                <WorkerForm
                    form={WorkerController.update.form(worker.id)}
                    payTypes={payTypes}
                    worker={worker}
                />
            </div>
        </>
    );
}

EditWorker.layout = {
    breadcrumbs: [{ title: 'Workers', href: index() }],
};

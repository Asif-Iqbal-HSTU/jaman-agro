import { Form, Head, Link } from '@inertiajs/react';
import CustomerPaymentController from '@/actions/App/Http/Controllers/CustomerPaymentController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { NativeSelect } from '@/components/native-select';
import { Balance } from '@/components/suppliers/balance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useTrans } from '@/hooks/use-trans';
import { index } from '@/routes/customers';
import type { Option } from '@/types';

type Props = {
    customers: { id: number; name: string }[];
    customerId: number | null;
    balance: string | null;
    methods: Option[];
    today: string;
};

export default function ReceivePayment({
    customers,
    customerId,
    balance,
    methods,
    today,
}: Props) {
    const { t } = useTrans();

    return (
        <>
            <Head title={t('Receive payment')} />
            <div className="p-4 md:p-6">
                <Heading
                    title={t('Receive payment')}
                    description={t(
                        'Money received from a customer against what they owe.',
                    )}
                />
                {balance !== null && (
                    <p className="mb-6 text-sm">
                        {t('Current balance')}:{' '}
                        <Balance
                            value={balance}
                            withLabel
                            positiveLabel="due"
                            className="font-semibold"
                        />
                    </p>
                )}

                <Form
                    {...CustomerPaymentController.store.form()}
                    className="max-w-2xl space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-6 sm:grid-cols-[12rem_1fr]">
                                <div className="grid gap-2">
                                    <Label htmlFor="paid_on">{t('Date')}</Label>
                                    <Input
                                        id="paid_on"
                                        name="paid_on"
                                        type="date"
                                        max={today}
                                        defaultValue={today}
                                        required
                                    />
                                    <InputError message={errors.paid_on} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="customer_id">
                                        {t('Customer')}
                                    </Label>
                                    <NativeSelect
                                        id="customer_id"
                                        name="customer_id"
                                        defaultValue={String(customerId ?? '')}
                                        required
                                    >
                                        <option value="">
                                            {t('Choose a customer')}
                                        </option>
                                        {customers.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </NativeSelect>
                                    <InputError message={errors.customer_id} />
                                </div>
                            </div>
                            <div className="grid gap-6 sm:grid-cols-3">
                                <div className="grid gap-2">
                                    <Label htmlFor="amount">
                                        {t('Amount (৳)')}
                                    </Label>
                                    <Input
                                        id="amount"
                                        name="amount"
                                        type="number"
                                        inputMode="decimal"
                                        min="0"
                                        step="0.01"
                                        required
                                        className="text-lg"
                                    />
                                    <InputError message={errors.amount} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="method">
                                        {t('Paid by')}
                                    </Label>
                                    <NativeSelect
                                        id="method"
                                        name="method"
                                        defaultValue="cash"
                                    >
                                        {methods.map((o) => (
                                            <option
                                                key={o.value}
                                                value={o.value}
                                            >
                                                {o.label}
                                            </option>
                                        ))}
                                    </NativeSelect>
                                    <InputError message={errors.method} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="reference">
                                        {t('Reference')}
                                    </Label>
                                    <Input
                                        id="reference"
                                        name="reference"
                                        placeholder={t(
                                            'Cheque, transaction ID…',
                                        )}
                                    />
                                    <InputError message={errors.reference} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="notes">{t('Notes')}</Label>
                                <Input id="notes" name="notes" />
                                <InputError message={errors.notes} />
                            </div>
                            <div className="flex items-center gap-3">
                                <Button disabled={processing}>
                                    {processing && <Spinner />}
                                    {t('Receive payment')}
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

ReceivePayment.layout = {
    breadcrumbs: [{ title: 'Customers', href: index() }],
};

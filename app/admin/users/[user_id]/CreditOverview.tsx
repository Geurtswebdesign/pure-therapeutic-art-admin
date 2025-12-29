'use client';

import { useState } from 'react';
import { adjustCredits } from './actions';
import { CreditWallet } from './types';

type Props = {
    wallet: CreditWallet;
    userId: string;
};

export default function CreditOverview({ wallet, userId }: Props) {
    const [amountInput, setAmountInput] = useState<number | ''>('');
    const [reasonInput, setReasonInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleAdjust(delta: number) {
        if (isSubmitting) return;

        setError(null);
        setIsSubmitting(true);

        try {
            await adjustCredits({
                userId,
                delta,
                reason: reasonInput,
            });

            setAmountInput('');
            setReasonInput('');
        } catch (err) {
            setError('Credits aanpassen mislukt');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <section className="rounded border p-4 space-y-4">
            <h2 className="text-lg font-semibold">Credits</h2>

            <div className="text-3xl font-bold">
                {wallet.credits_available}
            </div>

            <div className="flex gap-2">
                <button
                    onClick={() => handleAdjust(10)}
                    disabled={isSubmitting || !reasonInput}
                >
                    +10
                </button>

                <button
                    onClick={() => handleAdjust(-10)}
                    disabled={isSubmitting || !reasonInput}
                >
                    −10
                </button>
            </div>

            <div className="flex gap-2 items-center">
                <input
                    type="number"
                    placeholder="Vrij bedrag"
                    value={amountInput}
                    onChange={(e) =>
                        setAmountInput(
                            e.target.value === '' ? '' : Number(e.target.value)
                        )
                    }
                />

                <button
                    onClick={() => {
                        if (amountInput === '') return;
                        handleAdjust(amountInput);
                    }}
                    disabled={isSubmitting || amountInput === '' || !reasonInput}
                >
                    Toepassen
                </button>
            </div>

            <input
                type="text"
                placeholder="Reden (verplicht)"
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
            />

            {error && (
                <p className="text-red-600">{error}</p>
            )}
        </section>
    );
}

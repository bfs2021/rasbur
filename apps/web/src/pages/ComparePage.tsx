import { useState } from 'react';
import type { CompareResponse } from '@rasbur/shared';
import { api } from '@/services/api.js';
import DecodePipeline from '@/components/DecodePipeline.js';

export default function ComparePage() {
    const [inputA, setInputA] = useState('');
    const [inputB, setInputB] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<CompareResponse | null>(null);

    async function handleCompare() {
        if (!inputA.trim() || !inputB.trim()) {
            setError('Enter both inputs to compare them.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await api.post<CompareResponse>('/compare', {
                inputA: inputA.trim(),
                inputB: inputB.trim(),
            });
            if (response.ok) setResult(response);
            else setError('Failed to compare the inputs.');
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : 'Failed to compare the inputs.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="pg-page">
            <header className="pg-header">
                <div>
                    <p className="pg-kicker">Comparison</p>
                    <h1 className="pg-title">Compare encoded strings</h1>
                    <p className="pg-subtitle">
                        Decode two payloads and inspect the difference between their outputs.
                    </p>
                </div>
            </header>
            <section className="pg-grid pg-grid--two" style={{ marginTop: '1.5rem' }}>
                <label className="pg-field">
                    <span className="pg-label">Payload A</span>
                    <textarea
                        className="pg-textarea"
                        rows={10}
                        value={inputA}
                        onChange={(event) => setInputA(event.target.value)}
                        placeholder="Paste the first encoded string"
                    />
                </label>
                <label className="pg-field">
                    <span className="pg-label">Payload B</span>
                    <textarea
                        className="pg-textarea"
                        rows={10}
                        value={inputB}
                        onChange={(event) => setInputB(event.target.value)}
                        placeholder="Paste the second encoded string"
                    />
                </label>
            </section>
            <div className="pg-actions" style={{ marginTop: '1rem' }}>
                <button
                    className="pg-button pg-button--primary"
                    type="button"
                    onClick={handleCompare}
                    disabled={loading}
                >
                    {loading ? 'Comparing...' : 'Compare payloads'}
                </button>
                {error && <p className="pg-status pg-status--error">{error}</p>}
            </div>
            {result && (
                <section className="pg-grid pg-grid--two" style={{ marginTop: '1.5rem' }}>
                    {(
                        [
                            ['A', result.resultA, result.diff.filter((part) => !part.added)],
                            ['B', result.resultB, result.diff.filter((part) => !part.removed)],
                        ] as const
                    ).map(([label, decode, diff]) => (
                        <article key={label} className="pg-section">
                            <div className="pg-row">
                                <div>
                                    <p className="pg-kicker">Output {label}</p>
                                    <h2 className="pg-section-heading">Decoded result {label}</h2>
                                </div>
                                <span className="pg-badge">{decode.steps.length} steps</span>
                            </div>
                            <pre className="pg-code" style={{ marginTop: '1rem' }}>
                                {diff.map((part) => part.value).join('')}
                            </pre>
                            <div style={{ marginTop: '1rem' }}>
                                <h3 className="pg-section-heading">Pipeline steps</h3>
                                <DecodePipeline steps={decode.steps} />
                            </div>
                        </article>
                    ))}
                </section>
            )}
        </main>
    );
}

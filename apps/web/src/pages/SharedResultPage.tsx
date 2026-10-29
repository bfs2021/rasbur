import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { ShareData } from '@rasbur/shared';
import { api } from '@/services/api.js';
import DecodePipeline from '@/components/DecodePipeline.js';

export default function SharedResultPage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [shareData, setShareData] = useState<ShareData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!slug) return;
        api.get<any>(`/share/${slug}`)
            .then((response) =>
                response.ok && response.share
                    ? setShareData(response.share)
                    : setError(response.error || 'Shared result not found.')
            )
            .catch((reason) =>
                setError(reason instanceof Error ? reason.message : 'Shared result not found.')
            )
            .finally(() => setLoading(false));
    }, [slug]);

    if (loading)
        return (
            <main className="pg-page pg-page--compact pg-auth">
                <p className="pg-muted">Loading shared result...</p>
            </main>
        );
    if (error || !shareData?.historyId)
        return (
            <main className="pg-page pg-page--compact pg-auth">
                <section className="pg-card">
                    <h1 className="pg-title">Shared result unavailable</h1>
                    <p className="pg-copy">
                        {error ?? 'The requested shared result has expired or does not exist.'}
                    </p>
                    <div className="pg-actions" style={{ marginTop: '1.5rem' }}>
                        <Link className="pg-button pg-button--primary" to="/decode">
                            Open workspace
                        </Link>
                        <Link className="pg-button" to="/">
                            Return home
                        </Link>
                    </div>
                </section>
            </main>
        );

    const { historyId, viewCount, expiresAt, createdAt } = shareData;
    return (
        <main className="pg-page pg-page--narrow">
            <header className="pg-header">
                <div>
                    <p className="pg-kicker">Shared result</p>
                    <h1 className="pg-title">Snapshot {slug}</h1>
                    <p className="pg-subtitle">
                        Shared {new Date(createdAt).toLocaleDateString()} | {viewCount} views |
                        Expires {new Date(expiresAt).toLocaleDateString()}
                    </p>
                </div>
                <button
                    className="pg-button"
                    type="button"
                    onClick={() =>
                        navigate(`/decode?payload=${encodeURIComponent(historyId.originalInput)}`)
                    }
                >
                    Open in workspace
                </button>
            </header>
            <div className="pg-stack">
                <section className="pg-section">
                    <h2 className="pg-section-heading">Input</h2>
                    <pre className="pg-code">{historyId.originalInput}</pre>
                </section>
                <section className="pg-section">
                    <h2 className="pg-section-heading">Output</h2>
                    <pre className="pg-code">{historyId.finalOutput}</pre>
                </section>
                {historyId.steps.length > 0 && (
                    <section className="pg-section">
                        <h2 className="pg-section-heading">Steps</h2>
                        <DecodePipeline steps={historyId.steps} />
                    </section>
                )}
            </div>
        </main>
    );
}

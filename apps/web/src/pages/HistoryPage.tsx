import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { HistoryEntry } from '@rasbur/shared';
import { api } from '@/services/api.js';

const DECODER_TYPES = ['Hex', 'Base64', 'Morse', 'JWT', 'Binary', 'URL', 'ROT13', 'Caesar Cipher'];

export default function HistoryPage() {
    const navigate = useNavigate();
    const [entries, setEntries] = useState<HistoryEntry[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [encodingType, setEncodingType] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    async function fetchHistory() {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ page: String(page), limit: '10' });
            if (search.trim()) params.set('search', search.trim());
            if (encodingType) params.set('encodingType', encodingType);
            if (startDate) params.set('startDate', startDate);
            if (endDate) params.set('endDate', endDate);
            const response = await api.get<any>(`/history?${params}`);
            if (response.ok) {
                setEntries(response.entries);
                setTotal(response.total);
                setTotalPages(response.totalPages || 1);
            } else setError(response.error || 'Failed to load history.');
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : 'Failed to load history.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        const timer = window.setTimeout(() => void fetchHistory(), 300);
        return () => window.clearTimeout(timer);
    }, [page, search, encodingType, startDate, endDate]);

    async function removeEntry(id: string, event: React.MouseEvent) {
        event.stopPropagation();
        if (window.confirm('Delete this history entry?')) {
            await api.delete(`/history/${id}`);
            void fetchHistory();
        }
    }

    async function clearHistory() {
        if (window.confirm('Clear all decode history?')) {
            await api.delete('/history');
            setPage(1);
            void fetchHistory();
        }
    }

    async function shareEntry(id: string, event: React.MouseEvent) {
        event.stopPropagation();
        const response = await api.post<{ ok: boolean; share: { slug: string } }>('/share', {
            historyId: id,
            expiresInDays: 30,
        });
        if (response.ok && response.share?.slug)
            await navigator.clipboard.writeText(
                `${window.location.origin}/s/${response.share.slug}`
            );
    }

    return (
        <main className="pg-page">
            <header className="pg-header">
                <div>
                    <p className="pg-kicker">Saved results</p>
                    <h1 className="pg-title">Decode history</h1>
                    <p className="pg-subtitle">
                        Review, filter, share, or reopen previous decodes.
                    </p>
                </div>
                {entries.length > 0 && (
                    <button
                        className="pg-button pg-button--danger"
                        type="button"
                        onClick={clearHistory}
                    >
                        Clear history
                    </button>
                )}
            </header>
            <div className="pg-stack">
                <section className="pg-section">
                    <div className="pg-grid pg-grid--two">
                        <label className="pg-field">
                            <span className="pg-label">Search</span>
                            <input
                                className="pg-input"
                                value={search}
                                onChange={(event) => {
                                    setSearch(event.target.value);
                                    setPage(1);
                                }}
                                placeholder="Search input or output"
                            />
                        </label>
                        <label className="pg-field">
                            <span className="pg-label">Decoder</span>
                            <select
                                className="pg-select"
                                value={encodingType}
                                onChange={(event) => {
                                    setEncodingType(event.target.value);
                                    setPage(1);
                                }}
                            >
                                <option value="">All decoders</option>
                                {DECODER_TYPES.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="pg-field">
                            <span className="pg-label">From</span>
                            <input
                                className="pg-input"
                                type="date"
                                value={startDate}
                                onChange={(event) => {
                                    setStartDate(event.target.value);
                                    setPage(1);
                                }}
                            />
                        </label>
                        <label className="pg-field">
                            <span className="pg-label">To</span>
                            <input
                                className="pg-input"
                                type="date"
                                value={endDate}
                                onChange={(event) => {
                                    setEndDate(event.target.value);
                                    setPage(1);
                                }}
                            />
                        </label>
                    </div>
                </section>
                <section className="pg-section">
                    <h2 className="pg-section-heading">Results</h2>
                    {loading ? (
                        <p className="pg-section-copy">Loading history...</p>
                    ) : error ? (
                        <p className="pg-status pg-status--error">{error}</p>
                    ) : entries.length === 0 ? (
                        <div className="pg-empty">
                            No saved results.{' '}
                            <Link className="pg-link" to="/decode">
                                Open workspace
                            </Link>
                        </div>
                    ) : (
                        <ul className="pg-list">
                            {entries.map((entry) => (
                                <li
                                    key={entry._id}
                                    onClick={() =>
                                        setExpandedId(expandedId === entry._id ? null : entry._id)
                                    }
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="pg-item-head">
                                        <div>
                                            <p className="pg-kicker">
                                                {new Date(entry.createdAt).toLocaleString()}
                                            </p>
                                            <code>{entry.originalInput}</code>
                                            <div
                                                className="pg-actions"
                                                style={{ marginTop: '0.5rem' }}
                                            >
                                                {entry.steps.map((step) => (
                                                    <span
                                                        className="pg-badge"
                                                        key={`${entry._id}-${step.decoderName}`}
                                                    >
                                                        {step.decoderName}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="pg-actions">
                                            <button
                                                className="pg-button"
                                                type="button"
                                                onClick={(event) => shareEntry(entry._id, event)}
                                            >
                                                Share
                                            </button>
                                            <button
                                                className="pg-button"
                                                type="button"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    navigate(
                                                        `/decode?payload=${encodeURIComponent(entry.originalInput)}`
                                                    );
                                                }}
                                            >
                                                Open
                                            </button>
                                            <button
                                                className="pg-button pg-button--danger"
                                                type="button"
                                                onClick={(event) => removeEntry(entry._id, event)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                    {expandedId === entry._id && (
                                        <div
                                            className="pg-grid pg-grid--two"
                                            style={{ marginTop: '1rem' }}
                                            onClick={(event) => event.stopPropagation()}
                                        >
                                            <div className="pg-card">
                                                <p className="pg-label">Input</p>
                                                <pre className="pg-code">{entry.originalInput}</pre>
                                            </div>
                                            <div className="pg-card">
                                                <p className="pg-label">Output</p>
                                                <pre className="pg-code">{entry.finalOutput}</pre>
                                            </div>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                    {totalPages > 1 && (
                        <div className="pg-row" style={{ marginTop: '1rem' }}>
                            <p className="pg-muted">
                                {total} results | page {page} of {totalPages}
                            </p>
                            <div className="pg-actions">
                                <button
                                    className="pg-button"
                                    type="button"
                                    disabled={page === 1}
                                    onClick={() => setPage((value) => value - 1)}
                                >
                                    Previous
                                </button>
                                <button
                                    className="pg-button"
                                    type="button"
                                    disabled={page === totalPages}
                                    onClick={() => setPage((value) => value + 1)}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}

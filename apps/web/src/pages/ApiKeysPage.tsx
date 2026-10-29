import { useEffect, useState } from 'react';
import type { ApiKeyListItem, ApiKeyUsage, CreateApiKeyResult } from '@rasbur/shared';
import { api } from '@/services/api.js';

const PERMISSIONS = ['decode', 'history', 'share', 'compare'] as const;
type Permission = (typeof PERMISSIONS)[number];

function formatDate(value: string | Date | null | undefined) {
    return value ? new Date(value).toLocaleDateString() : 'No expiry';
}

export default function ApiKeysPage() {
    const [keys, setKeys] = useState<ApiKeyListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState('');
    const [permissions, setPermissions] = useState<Permission[]>(['decode']);
    const [expiresAt, setExpiresAt] = useState('');
    const [creating, setCreating] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [newKey, setNewKey] = useState<CreateApiKeyResult | null>(null);
    const [copied, setCopied] = useState(false);
    const [revokingId, setRevokingId] = useState<string | null>(null);
    const [usage, setUsage] = useState<Record<string, ApiKeyUsage>>({});
    const [usageLoadingId, setUsageLoadingId] = useState<string | null>(null);

    async function loadKeys() {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get<{ ok: boolean; apiKeys: ApiKeyListItem[] }>('/keys');
            setKeys(response.apiKeys);
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : 'Failed to load API keys.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadKeys();
    }, []);

    function togglePermission(permission: Permission) {
        setPermissions((current) =>
            current.includes(permission)
                ? current.filter((item) => item !== permission)
                : [...current, permission]
        );
    }

    async function createKey(event: React.FormEvent) {
        event.preventDefault();
        if (!name.trim() || permissions.length === 0) {
            setFormError(!name.trim() ? 'Give the key a name.' : 'Select at least one permission.');
            return;
        }
        setCreating(true);
        setFormError(null);
        try {
            const response = await api.post<{ ok: boolean; apiKey: CreateApiKeyResult }>('/keys', {
                name: name.trim(),
                permissions,
                ...(expiresAt ? { expiresAt: new Date(expiresAt).toISOString() } : {}),
            });
            if (response.ok && response.apiKey) {
                setNewKey(response.apiKey);
                setName('');
                setPermissions(['decode']);
                setExpiresAt('');
                setShowForm(false);
                void loadKeys();
            } else setFormError('Failed to create API key.');
        } catch (reason) {
            setFormError(reason instanceof Error ? reason.message : 'Failed to create API key.');
        } finally {
            setCreating(false);
        }
    }

    async function copyKey(value: string) {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
    }

    async function revokeKey(id: string) {
        if (!window.confirm('Revoke this API key? Applications using it will stop working.'))
            return;
        setRevokingId(id);
        try {
            if ((await api.delete<{ ok: boolean }>(`/keys/${id}`)).ok) void loadKeys();
        } finally {
            setRevokingId(null);
        }
    }

    async function toggleUsage(id: string) {
        if (usage[id]) {
            setUsage((current) => {
                const next = { ...current };
                delete next[id];
                return next;
            });
            return;
        }
        setUsageLoadingId(id);
        try {
            const response = await api.get<{ ok: boolean; usage: ApiKeyUsage }>(
                `/keys/${id}/usage`
            );
            if (response.ok && response.usage)
                setUsage((current) => ({ ...current, [id]: response.usage }));
        } finally {
            setUsageLoadingId(null);
        }
    }

    return (
        <main className="pg-page pg-page--narrow">
            <header className="pg-header">
                <div>
                    <p className="pg-kicker">Developer tools</p>
                    <h1 className="pg-title">API keys</h1>
                    <p className="pg-subtitle">
                        Create and manage keys for the reference workspace API.
                    </p>
                </div>
                <button
                    className="pg-button pg-button--primary"
                    type="button"
                    onClick={() => {
                        setShowForm((value) => !value);
                        setFormError(null);
                    }}
                >
                    {showForm ? 'Cancel' : 'Create key'}
                </button>
            </header>
            <div className="pg-stack">
                {newKey && (
                    <section className="pg-status pg-status--success">
                        <div>
                            <strong>API key created</strong>
                            <p style={{ margin: '0.5rem 0' }}>
                                Copy this key now. It will not be shown again.
                            </p>
                            <code>{newKey.rawKey}</code>
                        </div>
                        <button
                            className="pg-button"
                            type="button"
                            onClick={() => copyKey(newKey.rawKey)}
                        >
                            {copied ? 'Copied' : 'Copy key'}
                        </button>
                        <button
                            className="pg-icon-button"
                            type="button"
                            onClick={() => setNewKey(null)}
                            aria-label="Dismiss key"
                        >
                            x
                        </button>
                    </section>
                )}
                {showForm && (
                    <form className="pg-section pg-stack" onSubmit={createKey}>
                        <label className="pg-field">
                            <span className="pg-label">Key name</span>
                            <input
                                className="pg-input"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                maxLength={50}
                            />
                        </label>
                        <div className="pg-field">
                            <span className="pg-label">Permissions</span>
                            <div className="pg-actions">
                                {PERMISSIONS.map((permission) => (
                                    <button
                                        className={`pg-tab ${permissions.includes(permission) ? 'pg-tab--active' : ''}`}
                                        type="button"
                                        key={permission}
                                        onClick={() => togglePermission(permission)}
                                    >
                                        {permission}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <label className="pg-field">
                            <span className="pg-label">Expiry date</span>
                            <input
                                className="pg-input"
                                type="date"
                                value={expiresAt}
                                onChange={(event) => setExpiresAt(event.target.value)}
                            />
                        </label>
                        {formError && <p className="pg-status pg-status--error">{formError}</p>}
                        <div className="pg-actions">
                            <button
                                className="pg-button pg-button--primary"
                                type="submit"
                                disabled={creating}
                            >
                                {creating ? 'Creating...' : 'Create key'}
                            </button>
                        </div>
                    </form>
                )}
                <section className="pg-section">
                    <h2 className="pg-section-heading">Your keys</h2>
                    {loading ? (
                        <p className="pg-section-copy">Loading API keys...</p>
                    ) : error ? (
                        <p className="pg-status pg-status--error">{error}</p>
                    ) : keys.length === 0 ? (
                        <p className="pg-empty">No API keys yet.</p>
                    ) : (
                        <ul className="pg-list">
                            {keys.map((key) => {
                                const keyUsage = usage[key.id];
                                return (
                                    <li key={key.id}>
                                        <div className="pg-item-head">
                                            <div>
                                                <strong>{key.name}</strong>
                                                <p className="pg-section-copy">
                                                    <code>{key.prefix}...</code> | Created{' '}
                                                    {formatDate(key.createdAt)} |{' '}
                                                    {formatDate(key.expiresAt)}
                                                </p>
                                                <div
                                                    className="pg-actions"
                                                    style={{ marginTop: '0.5rem' }}
                                                >
                                                    {key.permissions.map((permission) => (
                                                        <span className="pg-badge" key={permission}>
                                                            {permission}
                                                        </span>
                                                    ))}
                                                    <span
                                                        className={`pg-badge ${key.isActive ? 'pg-badge--success' : 'pg-badge--error'}`}
                                                    >
                                                        {key.isActive ? 'Active' : 'Revoked'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="pg-actions">
                                                <button
                                                    className="pg-button"
                                                    type="button"
                                                    disabled={usageLoadingId === key.id}
                                                    onClick={() => toggleUsage(key.id)}
                                                >
                                                    {keyUsage ? 'Hide usage' : 'View usage'}
                                                </button>
                                                {key.isActive && (
                                                    <button
                                                        className="pg-button pg-button--danger"
                                                        type="button"
                                                        disabled={revokingId === key.id}
                                                        onClick={() => revokeKey(key.id)}
                                                    >
                                                        {revokingId === key.id
                                                            ? 'Revoking...'
                                                            : 'Revoke'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        {keyUsage && (
                                            <div
                                                className="pg-grid pg-grid--two"
                                                style={{ marginTop: '1rem' }}
                                            >
                                                <div className="pg-card">
                                                    <span className="pg-label">Today</span>
                                                    <strong>{keyUsage.today}</strong>
                                                </div>
                                                <div className="pg-card">
                                                    <span className="pg-label">Remaining</span>
                                                    <strong>{keyUsage.remaining}</strong>
                                                </div>
                                                <div className="pg-card">
                                                    <span className="pg-label">Daily limit</span>
                                                    <strong>{keyUsage.limit}</strong>
                                                </div>
                                                <div className="pg-card">
                                                    <span className="pg-label">Lifetime</span>
                                                    <strong>{keyUsage.usageCount}</strong>
                                                </div>
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>
            </div>
        </main>
    );
}

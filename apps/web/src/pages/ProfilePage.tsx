import { useEffect, useState } from 'react';
import type { User } from '@rasbur/shared';
import { api } from '@/services/api.js';

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
        null
    );

    useEffect(() => {
        let mounted = true;
        api.getUserProfile()
            .then((response) => {
                if (mounted && response.ok && response.user) {
                    setUser(response.user);
                    setName(response.user.name);
                }
            })
            .catch((error) => {
                if (mounted)
                    setMessage({
                        type: 'error',
                        text:
                            error instanceof Error
                                ? error.message
                                : 'Failed to load profile details.',
                    });
            })
            .finally(() => mounted && setLoading(false));
        return () => {
            mounted = false;
        };
    }, []);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!name.trim()) {
            setMessage({ type: 'error', text: 'Name cannot be blank.' });
            return;
        }
        setSaving(true);
        setMessage(null);
        try {
            const response = await api.updateUserProfile({ name: name.trim() });
            if (response.ok && response.user) {
                setUser(response.user);
                setName(response.user.name);
                setMessage({ type: 'success', text: 'Profile updated.' });
            } else {
                setMessage({ type: 'error', text: 'Failed to update profile.' });
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: error instanceof Error ? error.message : 'Failed to update profile.',
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <main className="pg-page pg-page--compact">
                <p className="pg-muted">Loading profile...</p>
            </main>
        );
    }

    return (
        <main className="pg-page pg-page--compact">
            <header className="pg-header">
                <div>
                    <p className="pg-kicker">Account</p>
                    <h1 className="pg-title">Profile</h1>
                </div>
            </header>
            <form className="pg-section pg-stack" onSubmit={handleSubmit}>
                <div className="pg-grid pg-grid--two">
                    <div>
                        <p className="pg-label">Signed in as</p>
                        <p className="pg-copy">{user?.email ?? 'Unavailable'}</p>
                    </div>
                    <div>
                        <p className="pg-label">Provider</p>
                        <p className="pg-copy">{user?.oauthProvider ?? 'Unavailable'}</p>
                    </div>
                </div>
                {message && (
                    <p
                        className={`pg-status ${message.type === 'success' ? 'pg-status--success' : 'pg-status--error'}`}
                    >
                        {message.text}
                    </p>
                )}
                <label className="pg-field" htmlFor="name">
                    <span className="pg-label">Name</span>
                    <input
                        className="pg-input"
                        id="name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        maxLength={80}
                        required
                    />
                </label>
                <div className="pg-actions">
                    <button
                        className="pg-button pg-button--primary"
                        type="submit"
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save changes'}
                    </button>
                </div>
            </form>
        </main>
    );
}

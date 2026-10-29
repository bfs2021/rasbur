import { getGithubLoginUrl, getGoogleLoginUrl, saveAuthTokens } from '@/services/auth.js';

export default function LoginPage() {
    const handleLogin = (provider: 'google' | 'github') => {
        window.location.href = provider === 'google' ? getGoogleLoginUrl() : getGithubLoginUrl();
    };

    const handleDevLogin = async () => {
        try {
            const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/$/, '');
            const response = await fetch(`${apiBaseUrl}/auth/dev-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();
            if (data.ok && data.accessToken && data.refreshToken) {
                saveAuthTokens(data.accessToken, data.refreshToken);
                const redirectTo = localStorage.getItem('redirectAfterLogin');
                localStorage.removeItem('redirectAfterLogin');
                window.location.href = redirectTo || '/decode';
            }
        } catch {
            return;
        }
    };

    return (
        <main className="pg-page pg-auth">
            <section className="pg-card">
                <p className="pg-kicker">Account</p>
                <h1 className="pg-title">Sign in</h1>
                <p className="pg-copy">
                    Sign in to use saved history and API keys in this reference workspace.
                </p>
                <div className="pg-divider" />
                <div className="pg-stack">
                    <button
                        className="pg-button pg-button--primary"
                        type="button"
                        onClick={() => handleLogin('google')}
                    >
                        Continue with Google
                    </button>
                    <button
                        className="pg-button"
                        type="button"
                        onClick={() => handleLogin('github')}
                    >
                        Continue with GitHub
                    </button>
                    {import.meta.env.DEV && (
                        <button className="pg-button" type="button" onClick={handleDevLogin}>
                            Developer sign in
                        </button>
                    )}
                </div>
            </section>
        </main>
    );
}

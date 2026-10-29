import { Link, useLocation } from 'react-router-dom';

export default function NotFoundPage() {
    const location = useLocation();
    return (
        <main className="pg-page pg-page--compact pg-auth">
            <section className="pg-card">
                <p className="pg-kicker">Error 404</p>
                <h1 className="pg-title">Page not found</h1>
                <pre className="pg-code">{`decode("${location.pathname}") = null`}</pre>
                <p className="pg-copy">That URL does not match a page in this workspace.</p>
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
}

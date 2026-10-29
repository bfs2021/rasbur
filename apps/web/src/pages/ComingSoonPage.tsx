import { Link } from 'react-router-dom';

interface ComingSoonPageProps {
    featureName: string;
    phase: string;
    description: string;
}

export default function ComingSoonPage({ featureName, description }: ComingSoonPageProps) {
    return (
        <main className="pg-page pg-page--compact pg-auth">
            <section className="pg-card">
                <p className="pg-kicker">Unavailable</p>
                <h1 className="pg-title">{featureName}</h1>
                <p className="pg-copy">{description}</p>
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

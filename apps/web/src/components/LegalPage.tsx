import { Link } from 'react-router-dom';

export interface LegalSection {
    heading: string;
    body: React.ReactNode;
}

interface LegalPageProps {
    title: string;
    lastUpdated: string;
    intro: string;
    sections: LegalSection[];
}

export default function LegalPage({ title, lastUpdated, intro, sections }: LegalPageProps) {
    return (
        <main className="pg-page pg-page--narrow">
            <header className="pg-header">
                <div>
                    <p className="pg-kicker">Last updated {lastUpdated}</p>
                    <h1 className="pg-title">{title}</h1>
                    <p className="pg-subtitle">{intro}</p>
                </div>
            </header>
            <div className="pg-stack">
                {sections.map((section) => (
                    <section key={section.heading} className="pg-section pg-rich">
                        <h2 className="pg-section-heading">{section.heading}</h2>
                        <div className="pg-section-copy">{section.body}</div>
                    </section>
                ))}
            </div>
            <p className="pg-copy">
                Questions? Open an issue on{' '}
                <a
                    className="pg-link"
                    href="https://github.com/omanshchoudhary/rasbur/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    GitHub
                </a>{' '}
                or return to the{' '}
                <Link className="pg-link" to="/">
                    home page
                </Link>
                .
            </p>
        </main>
    );
}

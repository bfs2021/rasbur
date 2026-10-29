import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api.js';

const CAPABILITIES = [
    [
        'Auto-detection',
        'Checks the input shape and the quality of decoded output before choosing a decoder.',
    ],
    [
        'Layered decoding',
        'Feeds a successful output into the pipeline again to unwrap stacked formats.',
    ],
    ['Published packages', 'Use @rasbur/decoders in code or @rasbur/mcp from an MCP client.'],
    ['Extensible registry', 'Register an additional decoder without changing the pipeline.'],
];

export default function AboutPage() {
    const [decoderCount, setDecoderCount] = useState<number | null>(null);

    useEffect(() => {
        let mounted = true;
        api.getDecoders()
            .then((decoders) => mounted && setDecoderCount(decoders.length))
            .catch(() => undefined);
        return () => {
            mounted = false;
        };
    }, []);

    return (
        <main className="pg-page pg-page--narrow">
            <header className="pg-header">
                <div>
                    <p className="pg-kicker">About Rasbur</p>
                    <h1 className="pg-title">Decode a string without naming the format.</h1>
                    <p className="pg-subtitle">
                        Rasbur is open-source software for identifying and unwrapping encoded
                        strings. The web workspace is a reference implementation for the published
                        decoder and MCP packages.
                    </p>
                </div>
            </header>
            <div className="pg-stack">
                <section className="pg-section">
                    <h2 className="pg-section-heading">How it decides</h2>
                    <p className="pg-section-copy">
                        A decoder must match the input and produce plausible output. This reduces
                        false positives from strings that look like Base64 or another format but
                        decode to garbage.
                    </p>
                </section>
                <section className="pg-section">
                    <h2 className="pg-section-heading">What it includes</h2>
                    <div className="pg-grid pg-grid--two" style={{ marginTop: '1rem' }}>
                        {CAPABILITIES.map(([title, copy]) => (
                            <article key={title} className="pg-card">
                                <h3 className="pg-section-heading">{title}</h3>
                                <p className="pg-section-copy">{copy}</p>
                            </article>
                        ))}
                    </div>
                </section>
                <section className="pg-section">
                    <h2 className="pg-section-heading">Available decoders</h2>
                    <p className="pg-section-copy">
                        {decoderCount === null
                            ? 'The decoder list is available through the package and MCP server.'
                            : `${decoderCount} registered decoders are available in this workspace.`}
                    </p>
                    <div className="pg-actions" style={{ marginTop: '1rem' }}>
                        <a
                            className="pg-button"
                            href="https://www.npmjs.com/package/@rasbur/decoders"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            View decoder package
                        </a>
                        <a
                            className="pg-button"
                            href="https://www.npmjs.com/package/@rasbur/mcp"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            View MCP package
                        </a>
                        <Link className="pg-button pg-button--primary" to="/decode">
                            Open workspace
                        </Link>
                    </div>
                </section>
            </div>
        </main>
    );
}

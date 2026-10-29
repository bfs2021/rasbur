import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { highlight } from '@/components/landing/highlight.js';
import UseCases from '@/components/landing/UseCases.js';
import Formats from '@/components/landing/Formats.js';
import CustomDecoder from '@/components/landing/CustomDecoder.js';
import Faq from '@/components/landing/Faq.js';
import Contribute from '@/components/landing/Contribute.js';
import SectionBar from '@/components/landing/SectionBar.js';

const INSTALL = 'npm install @rasbur/decoders';

const SPECIMEN = {
    input: 'NzQ2ODY1MjA3MDYxNzk2YzZmNjE2NDIwNzc2MTczMjA3NzcyNjE3MDcwNjU2NDIwNzQ2ODcyNjU2NTIwNzQ2OTZkNjU3Mw%3D%3D',
    steps: [
        { decoder: 'URL', confidence: '0.48' },
        { decoder: 'Base64', confidence: '0.70' },
        { decoder: 'Hex', confidence: '0.60' },
    ],
    output: 'the payload was wrapped three times',
};

const CODE_SNIPPET = `import {
    decodePipeline,
    registerDecoders,
} from '@rasbur/decoders';

registerDecoders();

const result = decodePipeline.decode(
    'NDg2NTZjNmM2ZjIwNTc2ZjcyNmM2NA==',
);`;

const CODE_RESULT = [
    { decoder: 'Base64', confidence: '0.50', output: '48656c6c6f20576f726c64' },
    { decoder: 'Hex', confidence: '0.60', output: 'Hello World' },
];

const MCP_CONFIG = `{
    "mcpServers": {
        "rasbur": {
            "command": "npx",
            "args": ["-y", "@rasbur/mcp"]
        }
    }
}`;

const TOOLS = [
    { name: 'decode', job: 'Unwraps a string layer by layer and returns each step.' },
    { name: 'identify', job: 'Ranks what a string probably is, without decoding it.' },
    { name: 'list_decoders', job: 'Lists every format it can read.' },
];

const SCORING = [
    { input: 'SGVsbG8gV29ybGQ=', decoder: 'Base64', shape: 0.9, quality: 1, output: 'Hello World' },
    { input: 'AKIAIOSFODNN7EXAMPLE', decoder: 'Base64', shape: 0.8, quality: 0, output: null },
    { input: 'AKIAIOSFODNN7EXAMPLE', decoder: 'Base85', shape: 0.75, quality: 0, output: null },
];

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!copied) return;
        const timer = window.setTimeout(() => setCopied(false), 1600);
        return () => window.clearTimeout(timer);
    }, [copied]);

    return (
        <button
            type="button"
            className="rb-copy"
            onClick={() => {
                void navigator.clipboard.writeText(text).then(() => setCopied(true));
            }}
        >
            {copied ? 'Copied' : 'Copy'}
        </button>
    );
}

export default function HomePage() {
    return (
        <div className="rb">
            <section className="rb-hero">
                <SectionBar path="~/rasbur" fact="Free and open source, MIT" />
                <div className="rb-hero-copy">
                    <h1 className="rb-title">
                        Decode a string{' '}
                        <span className="rb-accent">without knowing the format.</span>
                        <span className="rb-cursor" aria-hidden="true" />
                    </h1>
                    <p className="rb-lede">
                        Rasbur identifies the encoding, decodes it, and keeps unwrapping until only
                        plaintext is left. When it cannot tell, it says so instead of guessing.
                    </p>

                    <div className="rb-hero-actions">
                        <Link to="/decode" className="rb-primary">
                            Open the workspace
                        </Link>
                        <div className="rb-install-group">
                            <div className="rb-install">
                                <code className="rb-install-cmd">
                                    <span className="rb-prompt">$</span> {INSTALL}
                                </code>
                                <CopyButton text={INSTALL} />
                            </div>
                            <p className="rb-install-note">
                                Runs on your machine. Nothing you decode with it leaves it.
                            </p>
                        </div>
                    </div>

                    <div className="rb-hero-links">
                        <a href="#agent">Give it to an AI agent</a>
                        <a
                            href="https://github.com/omanshchoudhary/rasbur"
                            target="_blank"
                            rel="noreferrer"
                        >
                            Read the source
                        </a>
                    </div>
                </div>

                <figure className="rb-specimen" aria-label="Example decode">
                    <div className="rb-specimen-cell">
                        <span className="rb-specimen-key">Input</span>
                        <code className="rb-specimen-value rb-specimen-in">{SPECIMEN.input}</code>
                    </div>
                    <div className="rb-specimen-cell">
                        <span className="rb-specimen-key">Layers found</span>
                        <ol className="rb-specimen-steps">
                            {SPECIMEN.steps.map((step) => (
                                <li key={step.decoder}>
                                    <span>{step.decoder}</span>
                                    <span className="rb-num rb-faint">{step.confidence}</span>
                                </li>
                            ))}
                        </ol>
                    </div>
                    <div className="rb-specimen-cell rb-specimen-cell--out">
                        <span className="rb-specimen-key">Output</span>
                        <span className="rb-specimen-value rb-specimen-out">{SPECIMEN.output}</span>
                    </div>
                </figure>
            </section>

            <section className="rb-section">
                <SectionBar path="~/usage" fact="2 packages, 1 engine" />
                <h2 className="rb-h2">
                    Two ways in. <span className="rb-accent">One engine underneath.</span>
                </h2>
                <p className="rb-body rb-status">
                    Both are published on npm and usable today. They are at version 0.x, so the API
                    may still change between releases.
                </p>
                <div className="rb-split">
                    <div className="rb-cell">
                        <h3 className="rb-h3">In your code</h3>
                        <p className="rb-body">
                            One package, no dependencies. Call the pipeline on any string and read
                            back every layer it took.
                        </p>
                        <pre className="rb-code">{highlight(CODE_SNIPPET)}</pre>
                        <div className="rb-returns">
                            <p className="rb-returns-label">result.steps</p>
                            <table className="rb-returns-table">
                                <tbody>
                                    {CODE_RESULT.map((step) => (
                                        <tr key={step.decoder}>
                                            <td>{step.decoder}</td>
                                            <td className="rb-num">{step.confidence}</td>
                                            <td>{step.output}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <a
                            className="rb-link"
                            href="https://www.npmjs.com/package/@rasbur/decoders"
                            target="_blank"
                            rel="noreferrer"
                        >
                            @rasbur/decoders on npm
                        </a>
                    </div>

                    <div className="rb-cell" id="agent">
                        <h3 className="rb-h3">In your agent</h3>
                        <p className="rb-body">
                            An MCP server that hands your agent a real decoder, so it stops working
                            base64 out in its head. Runs locally, with no API key and no network
                            calls.
                        </p>
                        <pre className="rb-code">{highlight(MCP_CONFIG)}</pre>
                        <dl className="rb-tools">
                            {TOOLS.map((tool) => (
                                <div key={tool.name} className="rb-tool">
                                    <dt>{tool.name}</dt>
                                    <dd>{tool.job}</dd>
                                </div>
                            ))}
                        </dl>
                        <a
                            className="rb-link"
                            href="https://www.npmjs.com/package/@rasbur/mcp"
                            target="_blank"
                            rel="noreferrer"
                        >
                            @rasbur/mcp on npm
                        </a>
                    </div>
                </div>
            </section>

            <UseCases />

            <section className="rb-section rb-section--dark">
                <SectionBar path="~/scoring" fact="2 scores per decoder" />
                <h2 className="rb-h2">
                    Scored twice. <span className="rb-accent">Kept only if it reads.</span>
                </h2>
                <div className="rb-why">
                    <p className="rb-body rb-why-text">
                        Every decoder is scored twice: once on whether the input has the right
                        shape, and again on whether what comes out looks like real data. The two
                        scores multiply, and anything under 0.3 is dropped. A string that only looks
                        encoded comes back untouched.
                    </p>
                    <div className="rb-table-wrap">
                        <table className="rb-table">
                            <thead>
                                <tr>
                                    <th scope="col">Input</th>
                                    <th scope="col">Decoder</th>
                                    <th scope="col">Shape</th>
                                    <th scope="col">Decoded</th>
                                    <th scope="col">Reads as text</th>
                                    <th scope="col">Result</th>
                                </tr>
                            </thead>
                            <tbody>
                                {SCORING.map((row) => (
                                    <tr key={`${row.input}-${row.decoder}`}>
                                        <td>
                                            <code>{row.input}</code>
                                        </td>
                                        <td>{row.decoder}</td>
                                        <td className="rb-num">{row.shape.toFixed(2)}</td>
                                        <td>
                                            {row.output ?? (
                                                <span className="rb-faint">unreadable bytes</span>
                                            )}
                                        </td>
                                        <td className="rb-num">{row.quality.toFixed(2)}</td>
                                        <td className={row.output ? 'rb-kept' : 'rb-dropped'}>
                                            {row.output
                                                ? `kept, ${(row.shape * row.quality).toFixed(2)}`
                                                : 'dropped'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            <Formats />
            <CustomDecoder />
            <Faq />
            <Contribute />
        </div>
    );
}

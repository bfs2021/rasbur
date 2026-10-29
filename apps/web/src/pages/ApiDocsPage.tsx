import { useState } from 'react';

const DECODER_EXAMPLE = `import { decodePipeline, registerDecoders } from '@rasbur/decoders';

registerDecoders();
const result = decodePipeline.decode('SGVsbG8gV29ybGQ=');`;

const MCP_CONFIG = `{
  "mcpServers": {
    "rasbur": {
      "command": "npx",
      "args": ["-y", "@rasbur/mcp"]
    }
  }
}`;

export default function ApiDocsPage() {
    const [copied, setCopied] = useState<string | null>(null);
    async function copy(value: string, name: string) {
        await navigator.clipboard.writeText(value);
        setCopied(name);
        window.setTimeout(() => setCopied(null), 1600);
    }
    return (
        <main className="pg-page pg-page--narrow">
            <header className="pg-header">
                <div>
                    <p className="pg-kicker">Developer reference</p>
                    <h1 className="pg-title">Use Rasbur in code or with an agent</h1>
                    <p className="pg-subtitle">
                        Rasbur is distributed as npm packages. This workspace is a local reference
                        implementation.
                    </p>
                </div>
            </header>
            <div className="pg-stack">
                <section className="pg-section">
                    <div className="pg-row">
                        <div>
                            <h2 className="pg-section-heading">Decoder package</h2>
                            <p className="pg-section-copy">
                                Install @rasbur/decoders to auto-detect and unwrap encoded strings
                                in TypeScript or JavaScript.
                            </p>
                        </div>
                        <button
                            className="pg-button"
                            type="button"
                            onClick={() => copy(DECODER_EXAMPLE, 'decoder')}
                        >
                            {copied === 'decoder' ? 'Copied' : 'Copy example'}
                        </button>
                    </div>
                    <pre className="pg-code">{DECODER_EXAMPLE}</pre>
                </section>
                <section className="pg-section">
                    <div className="pg-row">
                        <div>
                            <h2 className="pg-section-heading">MCP server</h2>
                            <p className="pg-section-copy">
                                Add @rasbur/mcp to a compatible MCP client. It exposes decode,
                                identify, and list_decoders.
                            </p>
                        </div>
                        <button
                            className="pg-button"
                            type="button"
                            onClick={() => copy(MCP_CONFIG, 'mcp')}
                        >
                            {copied === 'mcp' ? 'Copied' : 'Copy config'}
                        </button>
                    </div>
                    <pre className="pg-code">{MCP_CONFIG}</pre>
                </section>
                <section className="pg-section">
                    <h2 className="pg-section-heading">Packages</h2>
                    <div className="pg-actions" style={{ marginTop: '1rem' }}>
                        <a
                            className="pg-button"
                            href="https://www.npmjs.com/package/@rasbur/decoders"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            @rasbur/decoders
                        </a>
                        <a
                            className="pg-button"
                            href="https://www.npmjs.com/package/@rasbur/mcp"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            @rasbur/mcp
                        </a>
                    </div>
                </section>
            </div>
        </main>
    );
}

import SectionBar from '@/components/landing/SectionBar.js';

type Layer = {
    decoder: string;
    confidence: number;
};

type Case = {
    id: string;
    title: string;
    body: string;
    input: string;
    layers: Layer[];
    output: string;
};

const CASES: Case[] = [
    {
        id: 'jwt',
        title: 'A JWT pasted from a log line',
        body: 'A bearer token arrives buried under request noise. Rasbur reads the header and the claims, and prints them as JSON.',
        input: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZW1vLXVzZXIiLCJpYXQiOjE3MzAwMDAwMDB9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        layers: [{ decoder: 'JWT', confidence: 0.92 }],
        output: `{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "demo-user",
    "iat": 1730000000
  }
}`,
    },
    {
        id: 'secret',
        title: 'A value from a Kubernetes Secret',
        body: 'Secret values are stored base64-encoded, and kubectl hands them over exactly that way. The connection string becomes readable again.',
        input: 'cG9zdGdyZXM6Ly9hcHA6ZXhhbXBsZUBkYjo1NDMyL2FwcA==',
        layers: [{ decoder: 'Base64', confidence: 0.75 }],
        output: 'postgres://app:example@db:5432/app',
    },
    {
        id: 'webhook',
        title: 'A percent-encoded webhook body',
        body: 'Providers percent-encode JSON before delivery, so the string arrives full of %7B and %22. One pass turns it back into something diffable.',
        input: '%7B%22event%22%3A%22ping%22%2C%22source%22%3A%22checkout%22%7D',
        layers: [{ decoder: 'URL', confidence: 0.83 }],
        output: '{"event":"ping","source":"checkout"}',
    },
    {
        id: 'email',
        title: 'A quoted-printable email header',
        body: 'Mail clients escape non-ASCII in headers the MIME way, with =XX byte pairs. Two layers apart, the subject line comes back clean.',
        input: 'Subject%3A%20rendez=2Dvous=20in=20Oslo',
        layers: [
            { decoder: 'Quoted-printable', confidence: 0.87 },
            { decoder: 'URL', confidence: 0.81 },
        ],
        output: 'Subject: rendez-vous in Oslo',
    },
    {
        id: 'ctf',
        title: 'A stacked CTF string',
        body: 'Challenge authors stack formats on purpose. Rasbur unwraps base64, then hex, and stops once the text is readable.',
        input: 'NmQ2NTc0NjU3MjIwNzI2NTYxNjQ2OTZlNjczYTIwMzAzNDMxMzcyMDZiNzc2OA==',
        layers: [
            { decoder: 'Base64', confidence: 0.9 },
            { decoder: 'Hex', confidence: 0.59 },
        ],
        output: 'meter reading: 0417 kwh',
    },
];

export default function UseCases() {
    return (
        <section className="rb-section">
            <SectionBar path="~/examples" fact="5 real strings" />
            <h2 className="rb-h2">
                Where it helps. <span className="rb-accent">The strings your tools hand you.</span>
            </h2>
            <div className="uc-grid">
                {CASES.map((item) => (
                    <div className="uc-cell" key={item.id}>
                        <h3 className="rb-h3">{item.title}</h3>
                        <p className="uc-copy">{item.body}</p>
                        <div className="uc-block">
                            <span className="uc-key">Input</span>
                            <code className="uc-in">{item.input}</code>
                        </div>
                        <ol className="uc-layers" aria-label="Layers found">
                            {item.layers.map((layer) => (
                                <li className="uc-layer" key={layer.decoder}>
                                    <span className="uc-decoder">{layer.decoder}</span>
                                    <span className="uc-conf rb-num">
                                        {layer.confidence.toFixed(2)}
                                    </span>
                                </li>
                            ))}
                        </ol>
                        <div className="uc-block uc-block--out">
                            <span className="uc-key">Output</span>
                            <code className="uc-out">{item.output}</code>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

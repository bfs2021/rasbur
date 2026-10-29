import SectionBar from '@/components/landing/SectionBar.js';

type FormatSpecimen = {
    name: string;
    decoder: string;
    input: string;
    output: string;
};

const FORMATS: FormatSpecimen[] = [
    {
        name: 'Base64',
        decoder: 'Base64',
        input: 'SGVsbG8sIHJhc2J1ciE=',
        output: 'Hello, rasbur!',
    },
    {
        name: 'base64url',
        decoder: 'Base64',
        input: 'SGVsbG8tcmFzYnVyXw',
        output: 'Hello-rasbur_',
    },
    {
        name: 'Base32',
        decoder: 'Base32',
        input: 'JBSWY3DPEB3W64TMMQQQ====',
        output: 'Hello world!',
    },
    {
        name: 'Base58',
        decoder: 'Base58',
        input: '9Ajdvzr',
        output: 'Hello',
    },
    {
        name: 'Base85',
        decoder: 'Base85',
        input: '87cURD_*#TDfTZ)',
        output: 'Hello, world',
    },
    {
        name: 'Hex',
        decoder: 'Hex',
        input: '52617362757220776f726b73',
        output: 'Rasbur works',
    },
    {
        name: 'Binary',
        decoder: 'Binary',
        input: '01010010 01100001 01110011 01100010 01110101 01110010',
        output: 'Rasbur',
    },
    {
        name: 'URL',
        decoder: 'URL',
        input: 'hello%20rasbur%21',
        output: 'hello rasbur!',
    },
    {
        name: 'ASCII codes',
        decoder: 'ASCII',
        input: '82 97 115 98 117 114',
        output: 'Rasbur',
    },
    {
        name: 'Morse',
        decoder: 'Morse',
        input: '.-. .- ... -... ..- .-.',
        output: 'RASBUR',
    },
    {
        name: 'ROT13',
        decoder: 'ROT13',
        input: 'Guvf vf gur grkg',
        output: 'This is the text',
    },
    {
        name: 'Caesar',
        decoder: 'Caesar Cipher',
        input: 'Udvexu lv iuhh',
        output: '[Shift: 23] Rasbur is free',
    },
    {
        name: 'JWT',
        decoder: 'JWT',
        input: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJyYXNidXIiLCJpYXQiOjE3NjE2OTYwMDB9.c2ln',
        output: '{\n  "header": {\n    "alg": "HS256",\n    "typ": "JWT"\n  },\n  "payload": {\n    "sub": "rasbur",\n    "iat": 1761696000\n  }\n}',
    },
    {
        name: 'Unicode escapes',
        decoder: 'Unicode Escape',
        input: '\\u0052\\u0061\\u0073\\u0062\\u0075\\u0072',
        output: 'Rasbur',
    },
    {
        name: 'HTML entities',
        decoder: 'HTML Entity',
        input: 'Rasbur &amp; friends',
        output: 'Rasbur & friends',
    },
    {
        name: 'Punycode',
        decoder: 'Punycode',
        input: 'xn--caf-dma',
        output: 'café',
    },
    {
        name: 'Quoted-printable',
        decoder: 'Quoted-Printable',
        input: 'Rasbur=20works=21',
        output: 'Rasbur works!',
    },
    {
        name: 'JSON escapes',
        decoder: 'JSON Stringify',
        input: '\\"Rasbur\\nworks\\"',
        output: '"Rasbur\nworks"',
    },
];

const MD5_SPECIMEN = {
    input: '5d41402abc4b2a76b9719d911017c592',
    output: 'Identified Hash:\nAlgorithm: MD5\nBit Length: 128\nHex Length: 32 characters\n\nNote: Hashes are one-way. Decoding shows the identified algorithm, not the original input.',
};

export default function Formats() {
    return (
        <section className="rb-section fm-section">
            <SectionBar path="~/formats" fact="18 decoders" />
            <h2 className="rb-h2 fm-title">
                Eighteen formats. <span className="rb-accent">Plus any you add.</span>
            </h2>

            <div className="fm-grid">
                {FORMATS.map((format) => (
                    <article className="fm-card" key={format.name}>
                        <div className="fm-head">
                            <h3 className="fm-name">{format.name}</h3>
                            <span className="fm-decoder">{format.decoder}</span>
                        </div>
                        <div className="fm-row">
                            <span className="fm-label">Input</span>
                            <code className="fm-code fm-code--input" title={format.input}>
                                {format.input}
                            </code>
                        </div>
                        <div className="fm-row">
                            <span className="fm-label">Decoded output</span>
                            <pre className="fm-code fm-code--output">{format.output}</pre>
                        </div>
                    </article>
                ))}
            </div>

            <div className="fm-hash">
                <p className="rb-body fm-note">
                    It also recognises hashes such as MD5, SHA-1 and SHA-256 by their length.
                    Missing a format? Register your own decoder without forking the engine.
                </p>
                <article className="fm-hash-card">
                    <h3 className="fm-name">MD5 identification</h3>
                    <div className="fm-row">
                        <span className="fm-label">Input</span>
                        <code className="fm-code fm-code--input" title={MD5_SPECIMEN.input}>
                            {MD5_SPECIMEN.input}
                        </code>
                    </div>
                    <div className="fm-row">
                        <span className="fm-label">Engine result</span>
                        <pre className="fm-code fm-code--output">{MD5_SPECIMEN.output}</pre>
                    </div>
                </article>
            </div>
        </section>
    );
}

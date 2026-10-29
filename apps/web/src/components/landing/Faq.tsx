import SectionBar from '@/components/landing/SectionBar.js';

const QUESTIONS = [
    {
        question: 'Is it safe to paste secrets?',
        answer: [
            'Use the local package or MCP server for secrets. The decoder package and MCP server run locally and their source does not make network calls.',
            'The hosted web workspace sends decode input to the API. The API logger records request id, method, path, status code and duration, not request bodies. The decode and identify routes return results directly. If you save history, the original input, steps and final output are stored. If you share a saved result, the share points to that stored history entry.',
        ],
    },
    {
        question: 'Does it decrypt encrypted data?',
        answer: [
            'No. Rasbur reverses encodings and simple transformations. The only cipher decoders in the engine are ROT13 and Caesar Cipher.',
            'Hashes are not reversed. The hash decoder identifies likely algorithms by hex length and says that hashes are one-way.',
        ],
    },
    {
        question: 'Why did it return nothing?',
        answer: [
            'A decoder first has to think the input has the right shape. Then Rasbur decodes it and checks whether the output looks like real text. Outputs with control characters, low ASCII content or weak text quality are dropped.',
            'In the workspace, choose a decoder from the decoder selector if you want to force one. Forced decoding bypasses the output quality check, so it can show garbage that automatic mode would reject.',
        ],
    },
    {
        question: 'How deep does it decode?',
        answer: [
            'The pipeline defaults to 5 layers. The web API schema accepts maxDepth from 1 to 10, and the MCP tool uses the same range.',
            'Each decode call also has a 2000 ms time budget that is checked between layers.',
        ],
    },
    {
        question: 'What does it cost?',
        answer: [
            'The repository, decoder package and MCP package are MIT licensed. The package and MCP server do not require an API key.',
            'The hosted workspace has usage limits: 20 anonymous decodes per day by IP and 200 signed-in decodes per day. Batch requests count each input.',
        ],
    },
    {
        question: 'Can I use it without knowing the format?',
        answer: [
            'Yes. The decode route calls the pipeline with your input and options, and the pipeline tries registered decoders, scores candidates and returns the steps it kept.',
            'If you already know the format, forceDecoder lets you skip detection and run a named decoder directly.',
        ],
    },
];

export default function Faq() {
    return (
        <section className="rb-section">
            <SectionBar path="~/faq" fact="6 questions" />
            <h2 className="rb-h2">
                Questions developers ask. <span className="rb-accent">Answered from the code.</span>
            </h2>

            <div className="fq-list">
                {QUESTIONS.map((item, index) => (
                    <details className="fq-item" key={item.question} open={index === 0}>
                        <summary className="fq-question">{item.question}</summary>
                        <div className="fq-answer">
                            {item.answer.map((paragraph) => (
                                <p key={paragraph}>{paragraph}</p>
                            ))}
                        </div>
                    </details>
                ))}
            </div>
        </section>
    );
}

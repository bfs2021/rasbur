import SectionBar from '@/components/landing/SectionBar.js';
import { highlight } from '@/components/landing/highlight.js';

const SNIPPET = `import {
    Decoder,
    decodePipeline,
    decodeRegistry,
    registerDecoders,
} from '@rasbur/decoders';

class CompanyTokenDecoder extends Decoder {
    readonly name = 'CompanyToken';

    confidence(input: string): number {
        return input.startsWith('ct_') ? 0.9 : 0;
    }

    decode(input: string): string | null {
        return input.slice(3);
    }

    explain(): string {
        return 'Stripped the internal ct_ token prefix.';
    }
}

registerDecoders();
decodeRegistry.register(new CompanyTokenDecoder());

const result = decodePipeline.decode(
    'ct_c2hpcHBpbmdfd2luZG93X2xvb2tzX2Nsb3NlZA==',
);

for (const step of result.steps) {
    console.log(step.decoderName, step.confidence.toFixed(2));
}
console.log(result.finalOutput);`;

const SNIPPET_STEPS = [
    { decoder: 'CompanyToken', confidence: '0.59' },
    { decoder: 'Base64', confidence: '0.88' },
];

const SNIPPET_INPUT = 'ct_c2hpcHBpbmdfd2luZG93X2xvb2tzX2Nsb3NlZA==';
const SNIPPET_OUTPUT = 'shipping_window_looks_closed';

const MEMBERS = [
    {
        term: 'name',
        detail: 'A readonly string that identifies your decoder in the result steps.',
    },
    {
        term: 'confidence',
        detail: 'Returns 0 to 1 for how much the input looks like your format. Zero of it means the pipeline never picks it.',
    },
    {
        term: 'decode',
        detail: 'Returns the decoded string, or null if it cannot.',
    },
    {
        term: 'explain',
        detail: 'Returns a sentence shown beside the step in a result.',
    },
];

export default function CustomDecoder() {
    return (
        <section className="rb-section">
            <SectionBar path="~/extend" fact="1 class, 4 members" />
            <h2 className="rb-h2">
                Write your own. <span className="rb-accent">It joins the pipeline.</span>
            </h2>
            <div className="rb-split">
                <div className="rb-cell">
                    <p className="rb-body">
                        Extend <code>Decoder</code>, implement the four members, and register an
                        instance. Your decoder then takes part in detection like any built-in, and
                        it composes with them: whatever it returns is offered to the next layer.
                    </p>
                    <dl className="rb-tools">
                        {MEMBERS.map((member) => (
                            <div className="rb-tool" key={member.term}>
                                <dt>{member.term}</dt>
                                <dd>{member.detail}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
                <div className="rb-cell">
                    <pre className="rb-code">{highlight(SNIPPET)}</pre>
                    <p className="cd-note">
                        The output of this exact run is shown below. The custom decoder takes the
                        outer layer, Base64 takes the next.
                    </p>
                </div>
            </div>
            <div className="cd-proof">
                <div className="cd-proof-cell">
                    <span className="cd-proof-key">Input in the run above</span>
                    <code className="cd-proof-in">{SNIPPET_INPUT}</code>
                </div>
                <div className="cd-proof-cell">
                    <span className="cd-proof-key">Layers found</span>
                    <ol className="cd-proof-steps">
                        {SNIPPET_STEPS.map((step) => (
                            <li key={step.decoder}>
                                <span>{step.decoder}</span>
                                <span className="rb-num">{step.confidence}</span>
                            </li>
                        ))}
                    </ol>
                </div>
                <div className="cd-proof-cell cd-proof-cell--out">
                    <span className="cd-proof-key">Output</span>
                    <code className="cd-proof-out">{SNIPPET_OUTPUT}</code>
                </div>
            </div>
        </section>
    );
}

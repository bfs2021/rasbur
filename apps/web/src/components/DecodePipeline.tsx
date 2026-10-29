import { useState, type CSSProperties } from 'react';
import type { DecodeResult } from '@rasbur/shared';

type DecodePipelineProps = {
    steps: DecodeResult['steps'];
};

function confidenceTier(confidence: number): 'high' | 'mid' | 'low' {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.5) return 'mid';
    return 'low';
}

export default function DecodePipeline({ steps }: DecodePipelineProps) {
    const [openSteps, setOpenSteps] = useState<Record<number, boolean>>({});

    if (steps.length === 0) {
        return <p className="ly-empty">No decoding steps were applied.</p>;
    }

    return (
        <ol className="ly">
            {steps.map((step, index) => {
                const isOpen = Boolean(openSteps[index]);
                const detailId = `ly-detail-${index}`;

                return (
                    <li
                        key={`${step.decoderName}-${index}`}
                        className="ly-step"
                        data-tier={confidenceTier(step.confidence)}
                        style={{ '--i': index } as CSSProperties}
                    >
                        <div className="ly-head">
                            <span className="ly-num">{index + 1}</span>
                            <span className="ly-name">{step.decoderName}</span>
                            <span
                                className="ly-conf"
                                aria-label={`confidence ${step.confidence.toFixed(2)}`}
                            >
                                <span className="ly-conf-track">
                                    <span
                                        className="ly-conf-fill"
                                        style={{ width: `${Math.min(step.confidence, 1) * 100}%` }}
                                    />
                                </span>
                                <span className="ly-conf-value">{step.confidence.toFixed(2)}</span>
                            </span>
                            <button
                                type="button"
                                className="ly-toggle"
                                aria-expanded={isOpen}
                                aria-controls={detailId}
                                onClick={() =>
                                    setOpenSteps((prev) => ({ ...prev, [index]: !prev[index] }))
                                }
                            >
                                {isOpen ? 'Hide' : 'Details'}
                            </button>
                        </div>

                        <pre className="ly-out">{step.output}</pre>

                        {isOpen && (
                            <div className="ly-detail" id={detailId}>
                                <p className="ly-explain">{step.explanation}</p>
                                <p className="ly-key">Input to this layer</p>
                                <pre className="ly-in">{step.input}</pre>
                            </div>
                        )}
                    </li>
                );
            })}
        </ol>
    );
}

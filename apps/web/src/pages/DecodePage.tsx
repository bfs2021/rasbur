import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { DecodeResult, DecodeOptions, DecoderInfo } from '@rasbur/shared';
import { api } from '@/services/api.js';
import { getAccessToken } from '@/services/auth.js';
import DecodePipeline from '@/components/DecodePipeline.js';
import { useWebSocket } from '@/hooks/useWebSocket.js';
import { useAuth } from '@/context/AuthContext.js';

type RequestState = 'idle' | 'loading' | 'success' | 'error';
type ErrorKind = 'limit' | 'unreachable';

type LiveDecodeResponse =
    | { ok: true; result: DecodeResult }
    | { ok: false; error: string; issues?: Array<{ path: string; message: string }> };

const LIVE_DECODE_DELAY_MS = 300;
const SLOW_REQUEST_MS = 4000;

const EXAMPLES = [
    {
        label: 'Three layers',
        value: 'NzQ2ODY1MjA3MDYxNzk2YzZmNjE2NDIwNzc2MTczMjA3NzcyNjE3MDcwNjU2NDIwNzQ2ODcyNjU2NTIwNzQ2OTZkNjU3Mw%3D%3D',
    },
    {
        label: 'JWT',
        value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJyYXNidXIiLCJyb2xlIjoicmVhZGVyIiwiaWF0IjoxNzMwMDAwMDAwfQ.Qm9lQ2mXhLr0N6aTq3vKjYw1sPzR8uFtGdE5cHbVnAo',
    },
    { label: 'Not encoded', value: 'AKIAIOSFODNN7EXAMPLE' },
];

function errorKindOf(err: unknown): ErrorKind {
    return err instanceof Error && err.message.includes('status 429') ? 'limit' : 'unreachable';
}

export default function DecodePage() {
    const [searchParams] = useSearchParams();
    const initialPayload = searchParams.get('payload') ?? '';
    const [input, setInput] = useState(initialPayload);
    const [result, setResult] = useState<DecodeResult | null>(null);
    const [requestState, setRequestState] = useState<RequestState>('idle');
    const [errorKind, setErrorKind] = useState<ErrorKind | null>(null);

    const { isAuthenticated } = useAuth();
    // Pass the auth token so the socket can authenticate. Without it the server
    // rejects the handshake and the badge shows a permanent "Connection error"
    // even though REST decoding still works. Keyed on isAuthenticated so login
    // /logout re-reads the token and reconnects.
    const { socket, isConnected } = useWebSocket({
        token: isAuthenticated ? getAccessToken() : null,
    });
    const [shareState, setShareState] = useState<'idle' | 'sharing' | 'copied' | 'error'>('idle');
    const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');
    const [decoders, setDecoders] = useState<DecoderInfo[]>([]);
    const [forcedDecoder, setForcedDecoder] = useState('');
    const requestIdRef = useRef(0);

    useEffect(() => {
        async function loadDecoders() {
            try {
                const list = await api.getDecoders();
                setDecoders(list);
            } catch {
                // selector falls back to auto-detect only
            }
        }
        void loadDecoders();
    }, []);

    function clearResult() {
        requestIdRef.current += 1;
        setResult(null);
        setRequestState('idle');
        setErrorKind(null);
    }

    async function runDecode(value: string, decoderName: string = forcedDecoder) {
        const trimmed = value.trim();
        if (!trimmed) {
            clearResult();
            return;
        }

        const requestId = ++requestIdRef.current;
        const options: DecodeOptions | undefined = decoderName
            ? { forceDecoder: decoderName }
            : undefined;
        setRequestState('loading');
        setErrorKind(null);

        function applyResult(next: DecodeResult) {
            if (requestId !== requestIdRef.current) return;
            setResult(next);
            setRequestState('success');
        }

        async function viaRest() {
            try {
                applyResult(await api.decode(trimmed, options));
            } catch (err) {
                if (requestId !== requestIdRef.current) return;
                setResult(null);
                setRequestState('error');
                setErrorKind(errorKindOf(err));
            }
        }

        if (!socket || !isConnected) {
            await viaRest();
            return;
        }

        socket.emit(
            'decode:live',
            options ? { input: trimmed, options } : { input: trimmed },
            (response: LiveDecodeResponse) => {
                if (response.ok) applyResult(response.result);
                else void viaRest();
            }
        );
    }

    useEffect(() => {
        if (initialPayload) void runDecode(initialPayload);
    }, []);

    useEffect(() => {
        if (!isConnected) return;
        if (!input.trim()) {
            clearResult();
            return;
        }
        // Only enter the loading state once the debounce settles, otherwise the
        // button flickers to "Decoding..." on every keystroke.
        const timeoutId = window.setTimeout(() => void runDecode(input), LIVE_DECODE_DELAY_MS);
        return () => window.clearTimeout(timeoutId);
    }, [input, isConnected, forcedDecoder]);

    function loadInput(value: string) {
        setInput(value);
        if (!isConnected) void runDecode(value);
    }

    async function handlePasteButton() {
        try {
            const text = await navigator.clipboard.readText();
            if (text) loadInput(text);
        } catch (err) {
            console.error('Error reading clipboard:', err);
        }
    }

    async function handleCopyOutput() {
        if (!result) return;
        try {
            await navigator.clipboard.writeText(result.finalOutput);
            setCopyState('copied');
            setTimeout(() => setCopyState('idle'), 1500);
        } catch (err) {
            console.error('Error copying output:', err);
        }
    }

    async function handleShare() {
        if (!result) return;
        setShareState('sharing');

        try {
            const historyResponse = await api.post<{ ok: boolean; history: { _id: string } }>(
                '/history',
                {
                    originalInput: result.originalInput,
                    steps: result.steps,
                    finalOutput: result.finalOutput,
                }
            );
            if (!historyResponse.ok || !historyResponse.history?._id) {
                throw new Error('Failed to create history entry');
            }

            const shareResponse = await api.post<{ ok: boolean; share: { slug: string } }>(
                '/share',
                {
                    historyId: historyResponse.history._id,
                    expiresInDays: 30,
                }
            );
            if (!shareResponse.ok || !shareResponse.share?.slug) {
                throw new Error('Failed to create share link');
            }

            await navigator.clipboard.writeText(
                `${window.location.origin}/s/${shareResponse.share.slug}`
            );
            setShareState('copied');
            setTimeout(() => setShareState('idle'), 2000);
        } catch (err) {
            console.error('Error sharing result:', err);
            setShareState('error');
            setTimeout(() => setShareState('idle'), 3000);
        }
    }

    const hasSteps = Boolean(result && result.steps.length > 0);
    const isLoading = requestState === 'loading';
    const [isSlow, setIsSlow] = useState(false);

    useEffect(() => {
        if (!isLoading) {
            setIsSlow(false);
            return;
        }
        const timer = window.setTimeout(() => setIsSlow(true), SLOW_REQUEST_MS);
        return () => window.clearTimeout(timer);
    }, [isLoading]);

    const statusText = isConnected
        ? 'Live. Decodes as you type.'
        : 'Decodes when you press Decode, paste, or pick an example.';

    const shareLabel =
        shareState === 'sharing'
            ? 'Saving'
            : shareState === 'copied'
              ? 'Link copied'
              : shareState === 'error'
                ? 'Could not share'
                : 'Share link';

    return (
        <div className="ws">
            <header className="ws-head">
                <h1 className="ws-title">Workspace</h1>
                <p className="ws-status" data-live={isConnected}>
                    {statusText}
                </p>
            </header>

            <p className="ws-notice">
                This workspace is a free demo on free-tier hosting. The server sleeps when idle, so
                the first decode can take up to a minute, and there is a daily limit. For anything
                you rely on, or anything sensitive, use{' '}
                <a
                    href="https://www.npmjs.com/package/@rasbur/decoders"
                    target="_blank"
                    rel="noreferrer"
                >
                    the npm package
                </a>
                , which runs on your machine.
            </p>

            <div className="ws-grid">
                <section className="ws-pane" aria-label="Input">
                    <div className="ws-bar">
                        <span className="ws-bar-title">Input</span>
                        <span className="ws-bar-meta">{input.length} characters</span>
                    </div>

                    <textarea
                        className="ws-textarea"
                        value={input}
                        spellCheck={false}
                        onChange={(event) => {
                            setInput(event.target.value);
                            if (!event.target.value.trim()) clearResult();
                        }}
                        onPaste={(event) => {
                            if (isConnected) return;
                            const field = event.currentTarget;
                            window.setTimeout(() => void runDecode(field.value), 0);
                        }}
                        onKeyDown={(event) => {
                            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                                event.preventDefault();
                                void runDecode(input);
                            }
                        }}
                        placeholder="Paste anything encoded: base64, hex, a JWT, URL-encoded text, Morse, or several layers stacked."
                        aria-label="Encoded input"
                    />

                    <div className="ws-controls">
                        <label className="ws-select">
                            <span>Decoder</span>
                            <select
                                value={forcedDecoder}
                                onChange={(event) => {
                                    setForcedDecoder(event.target.value);
                                    if (!isConnected && input.trim())
                                        void runDecode(input, event.target.value);
                                }}
                            >
                                <option value="">Detect automatically</option>
                                {decoders.map((decoder) => (
                                    <option key={decoder.name} value={decoder.name}>
                                        {decoder.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <div className="ws-controls-actions">
                            <button type="button" className="ws-ghost" onClick={handlePasteButton}>
                                Paste
                            </button>
                            <button
                                type="button"
                                className="ws-ghost"
                                onClick={() => {
                                    setInput('');
                                    clearResult();
                                }}
                                disabled={!input}
                            >
                                Clear
                            </button>
                            <button
                                type="button"
                                className="ws-primary"
                                onClick={() => void runDecode(input)}
                                disabled={isLoading || !input.trim()}
                            >
                                {isLoading ? 'Decoding' : 'Decode'}
                            </button>
                        </div>
                    </div>

                    <div className="ws-examples">
                        <span className="ws-examples-label">Examples</span>
                        {EXAMPLES.map((example) => (
                            <button
                                key={example.label}
                                type="button"
                                className="ws-example"
                                onClick={() => loadInput(example.value)}
                            >
                                {example.label}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="ws-pane ws-pane--result" aria-label="Result" aria-live="polite">
                    <div className="ws-bar">
                        <span className="ws-bar-title">Layers</span>
                        <span className="ws-bar-meta">
                            {isLoading
                                ? isSlow
                                    ? 'Waking the server'
                                    : 'Decoding'
                                : hasSteps && result
                                  ? `${result.steps.length} ${result.steps.length === 1 ? 'layer' : 'layers'}`
                                  : ''}
                        </span>
                    </div>

                    {isLoading && isSlow ? (
                        <div className="ws-message">
                            <p>
                                The free server is waking up. The first decode after a quiet spell
                                can take up to a minute, and the next ones are fast.
                            </p>
                        </div>
                    ) : requestState === 'error' ? (
                        <div className="ws-message ws-message--error">
                            {errorKind === 'limit' ? (
                                <p>
                                    You have reached today's limit for decoding without an account.{' '}
                                    <Link to="/login">Sign in</Link> to raise it.
                                </p>
                            ) : (
                                <p>
                                    Could not reach the decoder. Check that the API is running, then
                                    try again.
                                </p>
                            )}
                        </div>
                    ) : result && hasSteps ? (
                        <div className="ws-result" key={result.originalInput}>
                            <DecodePipeline steps={result.steps} />

                            <div
                                className="ws-out"
                                style={{ '--n': result.steps.length } as CSSProperties}
                            >
                                <div className="ws-out-head">
                                    <span className="ws-out-key">Output</span>
                                    <div className="ws-out-actions">
                                        <button
                                            type="button"
                                            className="ws-ghost"
                                            onClick={handleCopyOutput}
                                        >
                                            {copyState === 'copied' ? 'Copied' : 'Copy'}
                                        </button>
                                        <button
                                            type="button"
                                            className="ws-ghost"
                                            onClick={() => loadInput(result.finalOutput)}
                                        >
                                            Decode this next
                                        </button>
                                        {isAuthenticated && (
                                            <button
                                                type="button"
                                                className="ws-ghost"
                                                onClick={handleShare}
                                                disabled={shareState === 'sharing'}
                                            >
                                                {shareLabel}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <pre className="ws-out-text">{result.finalOutput}</pre>
                            </div>
                        </div>
                    ) : result ? (
                        <div className="ws-message">
                            {forcedDecoder ? (
                                <p>
                                    {forcedDecoder} could not decode this input. Switch the decoder
                                    back to automatic detection to let Rasbur choose.
                                </p>
                            ) : (
                                <p>
                                    No confident decode. This looks like plaintext, or it is not a
                                    format Rasbur reads. Rather than guess, it leaves the input as
                                    it was.
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="ws-message ws-message--idle">
                            <p>
                                Paste an encoded string, or pick one of the examples. Each layer
                                Rasbur unwraps shows up here, with its confidence and the output at
                                that step.
                            </p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

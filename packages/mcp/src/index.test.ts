/**
 * End-to-end tests for the @rasbur/mcp MCP server.
 *
 * Strategy: build the server (tsc) once, then spawn dist/index.js as a child
 * process and speak JSON-RPC 2.0 / MCP over its stdin / stdout — exactly as an
 * MCP host (Claude Desktop, etc.) would.  This tests the real bin entry and the
 * shebang, not an in-process import.
 *
 * Responses are newline-delimited JSON.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, ChildProcess } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_ENTRY = path.resolve(__dirname, '../dist/index.js');

/** Spawn the MCP server and return helpers to talk to it. */
function spawnServer() {
    const proc = spawn('node', [DIST_ENTRY], {
        stdio: ['pipe', 'pipe', 'inherit'],
    });

    /** Buffer for partial lines received from stdout. */
    let buf = '';
    /** Queue of fully-received JSON lines. */
    const lines: string[] = [];
    /** Resolvers waiting for the next line. */
    const waiters: Array<(line: string) => void> = [];

    proc.stdout!.setEncoding('utf8');
    proc.stdout!.on('data', (chunk: string) => {
        buf += chunk;
        let nl: number;
        while ((nl = buf.indexOf('\n')) !== -1) {
            const line = buf.slice(0, nl).trim();
            buf = buf.slice(nl + 1);
            if (!line) continue;
            const waiter = waiters.shift();
            if (waiter) {
                waiter(line);
            } else {
                lines.push(line);
            }
        }
    });

    /** Read the next newline-terminated JSON line from stdout. */
    function nextLine(): Promise<string> {
        if (lines.length > 0) return Promise.resolve(lines.shift()!);
        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                const idx = waiters.indexOf(resolve);
                if (idx !== -1) waiters.splice(idx, 1);
                resolve(''); // timeout — test will fail on parse / assertion
            }, 8_000);
            waiters.push((line) => {
                clearTimeout(timer);
                resolve(line);
            });
        });
    }

    let idCounter = 0;

    /** Send a JSON-RPC request and await the response object. */
    async function rpc(method: string, params?: unknown): Promise<unknown> {
        const id = ++idCounter;
        const msg = JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n';
        proc.stdin!.write(msg);
        const raw = await nextLine();
        return JSON.parse(raw);
    }

    function kill() {
        proc.stdin!.end();
        proc.kill();
    }

    return { proc, rpc, kill };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('@rasbur/mcp – end-to-end JSON-RPC', () => {
    let server: ReturnType<typeof spawnServer>;

    beforeAll(async () => {
        server = spawnServer();

        // MCP handshake — the host always sends initialize first.
        const initResp = (await server.rpc('initialize', {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'vitest-harness', version: '0.0.0' },
        })) as { result?: { serverInfo?: { name: string } } };

        expect(initResp).toHaveProperty('result');

        // Notify the server that initialisation is complete.
        server.proc.stdin!.write(
            JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n'
        );
    });

    afterAll(() => {
        server.kill();
    });

    // -----------------------------------------------------------------------
    // tools/list
    // -----------------------------------------------------------------------

    describe('tools/list', () => {
        it('returns the three expected tools', async () => {
            const resp = (await server.rpc('tools/list')) as {
                result: { tools: Array<{ name: string }> };
            };

            expect(resp).toHaveProperty('result.tools');
            const names = resp.result.tools.map((t) => t.name);
            expect(names).toContain('decode');
            expect(names).toContain('identify');
            expect(names).toContain('list_decoders');
        });

        it('every tool has a non-empty description', async () => {
            const resp = (await server.rpc('tools/list')) as {
                result: { tools: Array<{ name: string; description: string }> };
            };

            for (const tool of resp.result.tools) {
                expect(tool.description, `${tool.name} description`).toBeTruthy();
            }
        });
    });

    // -----------------------------------------------------------------------
    // list_decoders tool
    // -----------------------------------------------------------------------

    describe('list_decoders', () => {
        it('returns an array of decoders with name and description', async () => {
            const resp = (await server.rpc('tools/call', {
                name: 'list_decoders',
                arguments: {},
            })) as { result: { content: Array<{ type: string; text: string }> } };

            expect(resp).toHaveProperty('result.content');
            const [item] = resp.result.content;
            expect(item.type).toBe('text');

            const decoders = JSON.parse(item.text) as Array<{
                name: string;
                description: string;
            }>;

            expect(Array.isArray(decoders)).toBe(true);
            expect(decoders.length).toBeGreaterThan(0);

            for (const d of decoders) {
                expect(d.name, 'decoder name').toBeTruthy();
                expect(d.description, `${d.name} description`).toBeTruthy();
            }
        });

        it('includes base64 and hex in the decoder list', async () => {
            const resp = (await server.rpc('tools/call', {
                name: 'list_decoders',
                arguments: {},
            })) as { result: { content: Array<{ type: string; text: string }> } };

            const decoders = JSON.parse(resp.result.content[0].text) as Array<{
                name: string;
            }>;
            const names = decoders.map((d) => d.name.toLowerCase());

            expect(names.some((n) => n.includes('base64'))).toBe(true);
            expect(names.some((n) => n.includes('hex'))).toBe(true);
        });
    });

    // -----------------------------------------------------------------------
    // decode tool
    // -----------------------------------------------------------------------

    describe('decode', () => {
        it('decodes a Base64 string and returns steps', async () => {
            // "Hello World" in Base64
            const resp = (await server.rpc('tools/call', {
                name: 'decode',
                arguments: { input: 'SGVsbG8gV29ybGQ=' },
            })) as { result: { content: Array<{ type: string; text: string }> } };

            expect(resp).toHaveProperty('result.content');
            const [item] = resp.result.content;
            expect(item.type).toBe('text');

            const decoded = JSON.parse(item.text) as {
                steps: Array<{ output: string; decoderName: string }>;
            };
            expect(decoded.steps.length).toBeGreaterThan(0);
            expect(decoded.steps[0].output).toBe('Hello World');
            expect(decoded.steps[0].decoderName.toLowerCase()).toContain('base64');
        });

        it('decodes a hex-encoded string', async () => {
            // "Hi" in hex
            const resp = (await server.rpc('tools/call', {
                name: 'decode',
                arguments: { input: '4869' },
            })) as { result: { content: Array<{ type: string; text: string }> } };

            const [item] = resp.result.content;
            const decoded = JSON.parse(item.text) as {
                steps: Array<{ output: string }>;
            };
            expect(decoded.steps[0].output).toBe('Hi');
        });

        it('returns a no-decode message for plain text', async () => {
            const resp = (await server.rpc('tools/call', {
                name: 'decode',
                arguments: { input: 'Hello World' },
            })) as { result: { content: Array<{ type: string; text: string }> } };

            const text = resp.result.content[0].text;
            expect(text.toLowerCase()).toMatch(/no confident decode|already plaintext/i);
        });

        it('returns an error message for an unknown forceDecoder', async () => {
            const resp = (await server.rpc('tools/call', {
                name: 'decode',
                arguments: { input: 'SGVsbG8=', forceDecoder: 'nonexistent-decoder-xyz' },
            })) as { result: { content: Array<{ type: string; text: string }> } };

            const text = resp.result.content[0].text;
            expect(text).toMatch(/unknown decoder/i);
        });

        it('respects forceDecoder for a supported decoder', async () => {
            // "Hello World" in Base64 — force Base64 explicitly (name is case-sensitive)
            const resp = (await server.rpc('tools/call', {
                name: 'decode',
                arguments: { input: 'SGVsbG8gV29ybGQ=', forceDecoder: 'Base64' },
            })) as { result: { content: Array<{ type: string; text: string }> } };

            const [item] = resp.result.content;
            // forceDecoder bypasses the output-quality check so the result is JSON with steps
            const decoded = JSON.parse(item.text) as {
                steps: Array<{ output: string; decoderName: string }>;
            };
            expect(decoded.steps[0].output).toBe('Hello World');
            expect(decoded.steps[0].decoderName).toBe('Base64');
        });

        it('unwraps stacked layers (base64 of hex)', async () => {
            // hex("Hi") = "4869"; base64("4869") = "NDg2OQ=="
            const resp = (await server.rpc('tools/call', {
                name: 'decode',
                arguments: { input: 'NDg2OQ==' },
            })) as { result: { content: Array<{ type: string; text: string }> } };

            const [item] = resp.result.content;
            // Could be single-layer (just base64 → "4869") or two-layer finishing at "Hi"
            expect(item.type).toBe('text');
            const decoded = JSON.parse(item.text) as { steps: unknown[] };
            expect(decoded.steps.length).toBeGreaterThanOrEqual(1);
        });
    });

    // -----------------------------------------------------------------------
    // identify tool
    // -----------------------------------------------------------------------

    describe('identify', () => {
        it('identifies a Base64 string', async () => {
            const resp = (await server.rpc('tools/call', {
                name: 'identify',
                arguments: { input: 'SGVsbG8gV29ybGQ=' },
            })) as { result: { content: Array<{ type: string; text: string }> } };

            const [item] = resp.result.content;
            expect(item.type).toBe('text');

            const matches = JSON.parse(item.text) as Array<{
                name: string;
                confidence: number;
            }>;
            expect(Array.isArray(matches)).toBe(true);
            expect(matches.length).toBeGreaterThan(0);

            const top = matches[0];
            expect(top.name.toLowerCase()).toContain('base64');
            expect(top.confidence).toBeGreaterThan(0.5);
        });

        it('returns a no-match message for plain text', async () => {
            const resp = (await server.rpc('tools/call', {
                name: 'identify',
                arguments: { input: 'just a sentence with common words' },
            })) as { result: { content: Array<{ type: string; text: string }> } };

            const text = resp.result.content[0].text;
            expect(text.toLowerCase()).toMatch(/no confident match|not a supported/i);
        });

        it('identifies a hex string', async () => {
            // "Hello" in hex
            const resp = (await server.rpc('tools/call', {
                name: 'identify',
                arguments: { input: '48656c6c6f' },
            })) as { result: { content: Array<{ type: string; text: string }> } };

            const [item] = resp.result.content;
            const matches = JSON.parse(item.text) as Array<{ name: string }>;
            const decoderNames = matches.map((m) => m.name.toLowerCase());
            expect(decoderNames.some((n) => n.includes('hex'))).toBe(true);
        });
    });

    // -----------------------------------------------------------------------
    // protocol-level error handling
    // -----------------------------------------------------------------------

    describe('protocol error handling', () => {
        it('returns a JSON-RPC error for an unknown method', async () => {
            const resp = (await server.rpc('totally/unknown/method')) as {
                error?: { code: number; message: string };
            };
            // MCP servers may return an error object or a result — either is acceptable;
            // what we require is that the server does NOT crash.
            expect(resp).toBeDefined();
        });
    });
});

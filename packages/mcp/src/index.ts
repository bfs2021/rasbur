#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { decodePipeline, decodeRegistry, registerDecoders } from '@rasbur/decoders';
import * as z from 'zod/v4';

registerDecoders();

const server = new McpServer({ name: 'rasbur', version: '0.1.0' });

server.registerTool(
    'decode',
    {
        description:
            'Decode an encoded string without knowing its format in advance. Auto-detects the encoding, decodes it, and keeps unwrapping stacked layers such as base64 wrapping hex. Supports Base64, base64url, Base32, Base58, Base85, hex, binary, URL encoding, ASCII codes, Morse, ROT13, Caesar cipher, JWT, Unicode escapes, HTML entities, Punycode, quoted-printable and JSON string escapes. Returns each layer with the decoder used and a confidence score. Returns no steps when nothing decodes confidently, which means the input is already plaintext or is not a supported encoding. Use this instead of decoding by hand, especially for long strings or several stacked layers.',
        inputSchema: z.object({
            input: z.string().describe('The encoded string to decode.'),
            maxDepth: z
                .number()
                .int()
                .min(1)
                .max(10)
                .optional()
                .describe('Maximum number of layers to unwrap. Defaults to 5.'),
            strictMode: z
                .boolean()
                .optional()
                .describe('Stop unwrapping when the best candidate scores below 0.7.'),
            forceDecoder: z
                .string()
                .optional()
                .describe(
                    'Skip detection and use this decoder by name, from list_decoders. This bypasses the output quality check, so the result may be garbage where normal decoding would return nothing.'
                ),
        }),
    },
    async ({ input, maxDepth, strictMode, forceDecoder }) => {
        if (forceDecoder && !decodeRegistry.getByName(forceDecoder)) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Unknown decoder "${forceDecoder}". Call list_decoders for the valid names.`,
                    },
                ],
            };
        }

        const result = decodePipeline.decode(input, { maxDepth, strictMode, forceDecoder });

        if (result.steps.length === 0) {
            return {
                content: [
                    {
                        type: 'text',
                        text: forceDecoder
                            ? `${forceDecoder} could not decode this input. Try decoding without forceDecoder to let detection choose.`
                            : 'No confident decode. The input is already plaintext or is not a supported encoding.',
                    },
                ],
            };
        }

        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
    }
);

server.registerTool(
    'identify',
    {
        description:
            'Identify what encoding a string is, without decoding it. Returns the candidate encodings ranked by confidence, each with the decoder name and a description of that format. Candidates whose decoded output does not look like real data are excluded, so an empty list is a meaningful answer: the input is plaintext or is not a supported encoding. Use this when you only need to know what something is, and decode when you need the contents.',
        inputSchema: z.object({
            input: z.string().describe('The string to identify.'),
        }),
    },
    async ({ input }) => {
        const result = decodePipeline.identify(input);

        if (result.matches.length === 0) {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'No confident match. The input is already plaintext or is not a supported encoding.',
                    },
                ],
            };
        }

        return {
            content: [{ type: 'text', text: JSON.stringify(result.matches, null, 2) }],
        };
    }
);

server.registerTool(
    'list_decoders',
    {
        description:
            'List every encoding this server can detect and decode, with a description of each format. Takes no arguments. Use this to check whether a format is supported before trying to decode it.',
    },
    async () => {
        const decoders = decodeRegistry.getAll().map((decoder) => ({
            name: decoder.name,
            description: decoder.explain(),
        }));

        return {
            content: [{ type: 'text', text: JSON.stringify(decoders, null, 2) }],
        };
    }
);

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main();

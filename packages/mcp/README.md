# @rasbur/mcp

An MCP server that gives an AI agent a real decoder. When the agent hits an encoded string
mid-task, a base64 blob in a log, a JWT in a config, a value in a Kubernetes secret, it
calls a tool instead of decoding the string in its head.

Models decode short base64 reasonably well and quietly corrupt long strings, lose track
across stacked layers, and almost never say "I don't know". This runs the real thing and
returns nothing when the input is not actually encoded.

Runs locally over stdio. No API key, no network calls, nothing hosted.

## Setup

Works with any MCP client that supports stdio servers, which includes Claude Code, Claude
Desktop, Cursor, VS Code with Copilot, Windsurf, Zed and Gemini CLI.

Add it to your client's MCP config:

```json
{
    "mcpServers": {
        "rasbur": {
            "command": "npx",
            "args": ["-y", "@rasbur/mcp"]
        }
    }
}
```

The config file differs per client. Claude Code uses `.mcp.json` in the project root or
`claude mcp add`, Cursor uses `.cursor/mcp.json`, Claude Desktop uses
`claude_desktop_config.json`. Check your client's docs for the exact path.

No install step. `npx` fetches the package on first run.

## Tools

### `decode`

Decodes a string without being told the format. Auto-detects, decodes, and keeps
unwrapping stacked layers.

| Argument       | Type    | Description                                    |
| -------------- | ------- | ---------------------------------------------- |
| `input`        | string  | The encoded string.                            |
| `maxDepth`     | number  | Layers to unwrap, 1 to 10. Defaults to 5.      |
| `strictMode`   | boolean | Stop when the best candidate scores below 0.7. |
| `forceDecoder` | string  | Skip detection and use this decoder by name.   |

Returns each layer with the decoder used, a confidence score, and an explanation:

```json
{
    "originalInput": "eyJzdWIiOiIxMjM0NTY3ODkwIn0",
    "steps": [
        {
            "decoderName": "Base64",
            "confidence": 0.62,
            "input": "eyJzdWIiOiIxMjM0NTY3ODkwIn0",
            "output": "{\"sub\":\"1234567890\"}",
            "explanation": "Decoded from Base64 encoding, a scheme that represents binary data using 64 ASCII characters (A-Z, a-z, 0-9, +, /) with = padding."
        }
    ],
    "finalOutput": "{\"sub\":\"1234567890\"}"
}
```

When nothing decodes confidently it says so in plain text rather than returning an empty
result, so the agent gets an answer instead of a silence to interpret.

`forceDecoder` bypasses the output quality check by design, so it can return garbage where
normal decoding would return nothing.

### `identify`

Ranks the likely encodings for a string without decoding it. Takes `input`. Candidates
whose decoded output does not look like real data are excluded, so an empty result means
the input is plaintext or an unsupported format.

### `list_decoders`

Lists every supported encoding with a description of each. Takes no arguments.

## Supported encodings

Base64 (including base64url), Base32, Base58, Base85, hex, binary, URL encoding, ASCII
codes, Morse, ROT13, Caesar cipher, JWT, Unicode escapes, HTML entities, Punycode,
quoted-printable, JSON string escapes, and hash identification for MD5, SHA-1, SHA-256
and SHA-512.

Detection runs on [`@rasbur/decoders`](https://www.npmjs.com/package/@rasbur/decoders),
which scores both the shape of the input and the quality of the decoded output. That
second score is what lets it decline rather than guess.

## Limitations

Output scoring is tuned for ASCII and English text, so decoded output in other scripts
scores low and may be rejected. There is no entropy-based detection. A single decode call
is capped at two seconds.

## License

MIT. Part of [Rasbur](https://github.com/omanshchoudhary/rasbur).

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const BASE64_VALUES = new Map<string, number>();
for (let i = 0; i < BASE64_ALPHABET.length; i++) {
    BASE64_VALUES.set(BASE64_ALPHABET[i]!, i);
}
BASE64_VALUES.set('-', 62);
BASE64_VALUES.set('_', 63);

const utf8Decoder = new TextDecoder('utf-8', { ignoreBOM: true });

export function decodeBase64(input: string): Uint8Array {
    const bytes: number[] = [];
    let buffer = 0;
    let bits = 0;

    for (const char of input) {
        if (char === '=') break;
        const value = BASE64_VALUES.get(char);
        if (value === undefined) continue;
        buffer = ((buffer << 6) | value) & 0xffff;
        bits += 6;
        if (bits >= 8) {
            bytes.push((buffer >> (bits - 8)) & 0xff);
            bits -= 8;
        }
    }

    return Uint8Array.from(bytes);
}

export function bytesToUtf8(bytes: Uint8Array): string {
    return utf8Decoder.decode(bytes);
}

export function decodeBase64Text(input: string): string {
    return bytesToUtf8(decodeBase64(input));
}

import { Decoder } from '../base/Decoder.js';

export class Base64Decoder extends Decoder {
    readonly name = 'Base64';

    confidence(input: string): number {
        if (!input) return 0;

        const cleanInput = input.replace(/\s+/g, '');
        // Valid unpadded Base64/Base64url may leave two or three characters.
        if (cleanInput.length % 4 === 1) return 0;

        const base64Regex = /^[A-Za-z0-9+/_-]*={0,2}$/;
        if (!base64Regex.test(cleanInput)) return 0;

        if (cleanInput.length < 4) return 0;

        if (cleanInput.endsWith('=')) return 0.9;

        // Short unpadded strings ("test", "cool") are usually plain words,
        // not Base64. Claim them only weakly and let output quality decide.
        if (cleanInput.length < 8) return 0.4;

        return 0.8;
    }

    decode(input: string): string | null {
        try {
            const cleanInput = input.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
            const paddedInput = cleanInput.padEnd(
                cleanInput.length + ((4 - (cleanInput.length % 4)) % 4),
                '='
            );
            return Buffer.from(paddedInput, 'base64').toString('utf-8');
        } catch {
            return null;
        }
    }

    explain(): string {
        return 'Decoded from Base64 encoding, a scheme that represents binary data using 64 ASCII characters (A-Z, a-z, 0-9, +, /) with = padding.';
    }
}

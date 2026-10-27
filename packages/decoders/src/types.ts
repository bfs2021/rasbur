export interface DecodeStep {
    decoderName: string;
    confidence: number;
    input: string;
    output: string;
    explanation: string;
}

export interface DecodeResult {
    originalInput: string;
    steps: DecodeStep[];
    finalOutput: string;
}

export interface DecodeOptions {
    maxDepth?: number;
    strictMode?: boolean;
    forceDecoder?: string;
}

export interface IdentifyMatch {
    name: string;
    confidence: number;
    description: string;
}

export interface IdentifyResult {
    input: string;
    matches: IdentifyMatch[];
}

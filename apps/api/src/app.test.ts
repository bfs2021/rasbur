import request from 'supertest';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateKeyPairSync } from 'node:crypto';
import { importPKCS8, SignJWT } from 'jose';
import { app } from './app.js';
import { env } from './config/env.js';

const redisMockState = vi.hoisted(() => ({
    counters: new Map<string, number>(),
}));

const userMockState = vi.hoisted(() => ({
    currentUser: null as any,
    save: vi.fn(async () => {}),
}));

vi.mock('./cache/redis.js', () => ({
    redis: {
        expire: vi.fn(async () => 1),
        get: vi.fn(async () => 'ok'),
        incr: vi.fn(async (key: string) => {
            const nextCount = (redisMockState.counters.get(key) ?? 0) + 1;
            redisMockState.counters.set(key, nextCount);
            return nextCount;
        }),
        incrby: vi.fn(async (key: string, amount: number) => {
            const nextCount = (redisMockState.counters.get(key) ?? 0) + amount;
            redisMockState.counters.set(key, nextCount);
            return nextCount;
        }),
        set: vi.fn(async () => 'OK'),
    },
}));

vi.mock('./models/user.js', () => ({
    User: {
        findById: vi.fn(async (id: string) => {
            if (id === 'test-user-1') {
                return userMockState.currentUser;
            }
            return null;
        }),
    },
}));

const JWT_ALG = 'RS256';
let privateKey: any;
let publicKeyPem: string;

async function createToken(userId = 'test-user-1', email = 'test@example.com'): Promise<string> {
    return new SignJWT({
        email,
    })
        .setProtectedHeader({ alg: JWT_ALG })
        .setSubject(userId)
        .setIssuedAt()
        .setExpirationTime('15m')
        .sign(privateKey);
}

function createMockUser(overrides: Record<string, unknown> = {}) {
    return {
        id: 'test-user-1',
        name: 'Test User',
        email: 'test@example.com',
        avatar: 'avatar-url',
        dailyDecodeCount: 5,
        lastDecodeReset: new Date(),
        save: userMockState.save,
        ...overrides,
    };
}

beforeAll(async () => {
    const keyPair = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        privateKeyEncoding: {
            format: 'pem',
            type: 'pkcs8',
        },
        publicKeyEncoding: {
            format: 'pem',
            type: 'spki',
        },
    });

    privateKey = await importPKCS8(keyPair.privateKey, JWT_ALG);
    publicKeyPem = keyPair.publicKey;
    env.JWT_PUBLIC_KEY = publicKeyPem;
});

describe('API app', () => {
    beforeEach(() => {
        redisMockState.counters.clear();
        userMockState.save.mockClear();
        userMockState.currentUser = createMockUser();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns health status from GET /health', async () => {
        const response = await request(app).get('/health');

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('ok');
        expect(response.body.environment).toBe('test');
        expect(response.body).toHaveProperty('uptime');
        expect(response.body).toHaveProperty('timestamp');
        expect(response.body).toHaveProperty('requestId');
        expect(response.headers).toHaveProperty('x-request-id');
    });

    it('returns the list of available decoders from GET /api/decoders', async () => {
        const response = await request(app).get('/api/decoders');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);

        expect(response.body[0]).toHaveProperty('name');
        expect(response.body[0]).toHaveProperty('description');

        expect(response.headers).toHaveProperty('x-ratelimit-limit');
        expect(response.headers).toHaveProperty('x-ratelimit-remaining');
        expect(response.headers).toHaveProperty('x-ratelimit-reset');
    });

    it('decodes a valid input with POST /api/decode', async () => {
        const token = await createToken();
        const response = await request(app)
            .post('/api/decode')
            .set('Authorization', `Bearer ${token}`)
            .send({
                input: 'SGVsbG8=',
            });

        expect(response.status).toBe(200);
        expect(response.body.originalInput).toBe('SGVsbG8=');
        expect(response.body.finalOutput).toBe('Hello');
        expect(Array.isArray(response.body.steps)).toBe(true);
        expect(response.body.steps.length).toBeGreaterThan(0);

        expect(response.body.steps[0]).toHaveProperty('decoderName');
        expect(response.body.steps[0]).toHaveProperty('confidence');
        expect(response.body.steps[0]).toHaveProperty('input');
        expect(response.body.steps[0]).toHaveProperty('output');
        expect(response.body.steps[0]).toHaveProperty('explanation');
    });

    it('increments authenticated daily decode count and saves the user', async () => {
        const now = new Date('2026-01-15T12:00:00.000Z');
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(now);
        userMockState.currentUser = createMockUser({
            dailyDecodeCount: 5,
            lastDecodeReset: now,
        });

        const token = await createToken();
        const response = await request(app)
            .post('/api/decode')
            .set('Authorization', `Bearer ${token}`)
            .send({
                input: 'SGVsbG8=',
            });

        expect(response.status).toBe(200);
        expect(userMockState.currentUser.dailyDecodeCount).toBe(6);
        expect(userMockState.save).toHaveBeenCalledTimes(1);
    });

    it('sets authenticated rate limit headers from the stored daily count', async () => {
        const now = new Date('2026-01-15T12:00:00.000Z');
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(now);
        userMockState.currentUser = createMockUser({
            dailyDecodeCount: 199,
            lastDecodeReset: now,
        });

        const token = await createToken();
        const response = await request(app)
            .post('/api/decode')
            .set('Authorization', `Bearer ${token}`)
            .send({
                input: 'SGVsbG8=',
            });

        expect(response.status).toBe(200);
        expect(response.headers['x-ratelimit-limit']).toBe('200');
        expect(response.headers['x-ratelimit-remaining']).toBe('0');
    });

    it('returns 429 with the free daily limit message when authenticated limit is exceeded', async () => {
        const now = new Date('2026-01-15T12:00:00.000Z');
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(now);
        userMockState.currentUser = createMockUser({
            dailyDecodeCount: 200,
            lastDecodeReset: now,
        });

        const token = await createToken();
        const response = await request(app)
            .post('/api/decode')
            .set('Authorization', `Bearer ${token}`)
            .send({
                input: 'SGVsbG8=',
            });

        expect(response.status).toBe(429);
        expect(response.body.message).toBe(
            'Daily limit of 200 decodes reached. It resets at 00:00 UTC.'
        );
        expect(response.headers['x-ratelimit-limit']).toBe('200');
        expect(response.headers['x-ratelimit-remaining']).toBe('0');
        expect(userMockState.save).not.toHaveBeenCalled();
    });

    it('resets authenticated daily count when last reset was on a previous UTC day', async () => {
        const now = new Date('2026-01-15T00:30:00.000Z');
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(now);
        userMockState.currentUser = createMockUser({
            dailyDecodeCount: 199,
            lastDecodeReset: new Date('2026-01-14T23:59:59.000Z'),
        });

        const token = await createToken();
        const response = await request(app)
            .post('/api/decode')
            .set('Authorization', `Bearer ${token}`)
            .send({
                input: 'SGVsbG8=',
            });

        expect(response.status).toBe(200);
        expect(userMockState.currentUser.dailyDecodeCount).toBe(1);
        expect(userMockState.currentUser.lastDecodeReset.getTime()).toBe(now.getTime());
        expect(response.headers['x-ratelimit-remaining']).toBe('199');
        expect(userMockState.save).toHaveBeenCalledTimes(1);
    });

    it('counts each batch input toward the authenticated daily limit', async () => {
        const now = new Date('2026-01-15T12:00:00.000Z');
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(now);
        userMockState.currentUser = createMockUser({
            dailyDecodeCount: 5,
            lastDecodeReset: now,
        });

        const token = await createToken();
        const response = await request(app)
            .post('/api/decode/batch')
            .set('Authorization', `Bearer ${token}`)
            .send({
                inputs: ['SGVsbG8=', '48656c6c6f', '01001000'],
            });

        expect(response.status).toBe(200);
        expect(userMockState.currentUser.dailyDecodeCount).toBe(8);
        expect(response.headers['x-ratelimit-limit']).toBe('200');
        expect(response.headers['x-ratelimit-remaining']).toBe('192');
        expect(userMockState.save).toHaveBeenCalledTimes(1);
    });

    it('returns validation error for invalid POST /api/decode body', async () => {
        const token = await createToken();
        const response = await request(app)
            .post('/api/decode')
            .set('Authorization', `Bearer ${token}`)
            .send({});

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('Validation error');
        expect(Array.isArray(response.body.errors)).toBe(true);
        expect(response.body).toHaveProperty('requestId');
        expect(response.headers).toHaveProperty('x-request-id');
    });

    it('identifies likely encoding formats with POST /api/identify', async () => {
        const token = await createToken();
        const response = await request(app)
            .post('/api/identify')
            .set('Authorization', `Bearer ${token}`)
            .send({
                input: 'SGVsbG8=',
            });

        expect(response.status).toBe(200);
        expect(response.body.input).toBe('SGVsbG8=');
        expect(Array.isArray(response.body.matches)).toBe(true);
        expect(response.body.matches.length).toBeGreaterThan(0);

        expect(response.body.matches[0]).toHaveProperty('name');
        expect(response.body.matches[0]).toHaveProperty('confidence');
        expect(response.body.matches[0]).toHaveProperty('description');
    });

    it('batch decodes multiple inputs with POST /api/decode/batch', async () => {
        const token = await createToken();
        const response = await request(app)
            .post('/api/decode/batch')
            .set('Authorization', `Bearer ${token}`)
            .send({
                inputs: ['SGVsbG8=', '48656c6c6f'],
            });

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.items)).toBe(true);
        expect(response.body.items).toHaveLength(2);

        expect(response.body.items[0].input).toBe('SGVsbG8=');
        expect(response.body.items[0].result.finalOutput).toBe('Hello');

        expect(response.body.items[1].input).toBe('48656c6c6f');
        expect(response.body.items[1].result.finalOutput).toBe('Hello');
    });

    it('returns validation error for empty batch decode request', async () => {
        const token = await createToken();
        const response = await request(app)
            .post('/api/decode/batch')
            .set('Authorization', `Bearer ${token}`)
            .send({
                inputs: [],
            });

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('Validation error');
        expect(Array.isArray(response.body.errors)).toBe(true);
    });

    it('returns 404 for unknown routes', async () => {
        const response = await request(app).get('/does-not-exist');

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Route not found');
    });

    it('applies rate limit headers on API routes', async () => {
        const response = await request(app).get('/api/decoders');

        expect(response.status).toBe(200);
        expect(response.headers).toHaveProperty('x-ratelimit-limit');
        expect(response.headers).toHaveProperty('x-ratelimit-remaining');
        expect(response.headers).toHaveProperty('x-ratelimit-reset');
    });

    it('does not apply rate limit headers on /health', async () => {
        const response = await request(app).get('/health');

        expect(response.status).toBe(200);
        expect(response.headers['x-ratelimit-limit']).toBeUndefined();
        expect(response.headers['x-ratelimit-remaining']).toBeUndefined();
        expect(response.headers['x-ratelimit-reset']).toBeUndefined();
    });
});

import { AuthenticationError } from '@app/domain/errors';
import { fail, ok } from '@shared/result';
import { asValue } from 'awilix';
import { beforeEach, describe, expect, it } from 'vitest';
import { createToken, registerUser } from '../helpers';
import { createTestContext } from '../setup';

describe('Auth Feature', () => {
  const ctx = createTestContext();

  beforeEach(() => {
    ctx.clearAllRepositories();
  });

  // ── Google Login ──

  describe('Google Login', () => {
    it('POST /auth/google — returns 200 with token and user for valid token', async () => {
      const mockVerifyToken = async () => ok({ email: 'alice@example.com', name: 'Alice' });
      ctx.container.register('googleAuth', asValue({ verifyToken: mockVerifyToken }));

      const res = await ctx.request.post('/auth/google').send({ token: 'valid-google-token' });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(typeof res.body.token).toBe('string');
      expect(res.body.user.email).toBe('alice@example.com');
      expect(res.body.user.name).toBe('Alice');
    });

    it('POST /auth/google — returns 400 when token missing', async () => {
      const res = await ctx.request.post('/auth/google').send({});
      expect(res.status).toBe(400);
    });

    it('POST /auth/google — returns 401 for invalid token', async () => {
      const mockVerifyToken = async () =>
        fail(new AuthenticationError('Invalid or expired Google token.'));
      ctx.container.register('googleAuth', asValue({ verifyToken: mockVerifyToken }));

      const res = await ctx.request.post('/auth/google').send({ token: 'invalid-token' });

      expect(res.status).toBe(401);
    });
  });

  // ── Apple Login ──

  describe('Apple Login', () => {
    it('POST /auth/apple — returns 200 + JWT + user DTO for valid token (new user)', async () => {
      const res = await ctx.request.post('/auth/apple').send({ token: 'valid-apple-token' });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(typeof res.body.token).toBe('string');
      expect(res.body.user.email).toBe('bob@apple.com');
      expect(res.body.user.name).toBe('Bob');
      expect(res.body.user.id).toBeDefined();
    });

    it('POST /auth/apple — returns 200 for existing user (no duplicate)', async () => {
      await ctx.request.post('/auth/apple').send({ token: 'valid-apple-token' });

      const res = await ctx.request.post('/auth/apple').send({ token: 'valid-apple-token' });

      expect(res.status).toBe(200);
    });

    it('POST /auth/apple — returns 401 for invalid token', async () => {
      const res = await ctx.request.post('/auth/apple').send({ token: 'bad-token' });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('AuthenticationError');
    });

    it('POST /auth/apple — returns 400 when token is missing', async () => {
      const res = await ctx.request.post('/auth/apple').send({});

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('ValidationError');
    });
  });

  // ── Get Current User ──

  describe('Get Current User', () => {
    it('GET /auth/me — returns 200 with user DTO for valid JWT', async () => {
      const { token } = await registerUser(ctx.container, 'alice@example.com', 'Alice');

      const res = await ctx.request.get('/auth/me').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe('alice@example.com');
      expect(res.body.name).toBe('Alice');
    });

    it('GET /auth/me — returns 401 without auth header', async () => {
      const res = await ctx.request.get('/auth/me');

      expect(res.status).toBe(401);
    });

    it('GET /auth/me — returns 401 with invalid JWT', async () => {
      const res = await ctx.request.get('/auth/me').set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
    });

    it('GET /auth/me — returns 404 when user does not exist in DB', async () => {
      const token = createToken('nonexistent-uuid', 'usr000', 'ghost@example.com');

      const res = await ctx.request.get('/auth/me').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  // ── Authorization Layer ──

  describe('Authorization Layer', () => {
    it('mutation endpoint returns 401 without auth token', async () => {
      const res = await ctx.request.post('/establishments').send({ name: 'Salon' });

      expect(res.status).toBe(401);
    });

    it('non-owner updating establishment returns 403', async () => {
      const owner = await registerUser(ctx.container, 'owner@test.com', 'Owner');
      const other = await registerUser(ctx.container, 'other@test.com', 'Other');

      const estRes = await ctx.request
        .post('/establishments')
        .set('Authorization', `Bearer ${owner.token}`)
        .send({ name: 'My Salon' });

      const estCode = estRes.body.id;

      const res = await ctx.request
        .put(`/establishments/${estCode}`)
        .set('Authorization', `Bearer ${other.token}`)
        .send({ name: 'Hacked' });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('ForbiddenError');
    });

    it('non-owner deleting establishment returns 403', async () => {
      const owner = await registerUser(ctx.container, 'owner@test.com', 'Owner');
      const other = await registerUser(ctx.container, 'other@test.com', 'Other');

      const estRes = await ctx.request
        .post('/establishments')
        .set('Authorization', `Bearer ${owner.token}`)
        .send({ name: 'My Salon' });

      const estCode = estRes.body.id;

      const res = await ctx.request
        .delete(`/establishments/${estCode}`)
        .set('Authorization', `Bearer ${other.token}`);

      expect(res.status).toBe(403);
    });

    it('non-owner creating resource in another establishment returns 403', async () => {
      const owner = await registerUser(ctx.container, 'owner@test.com', 'Owner');
      const other = await registerUser(ctx.container, 'other@test.com', 'Other');

      const estRes = await ctx.request
        .post('/establishments')
        .set('Authorization', `Bearer ${owner.token}`)
        .send({ name: 'My Salon' });

      const estCode = estRes.body.id;

      const res = await ctx.request
        .post(`/establishments/${estCode}/resources`)
        .set('Authorization', `Bearer ${other.token}`)
        .send({ name: 'Alice' });

      expect(res.status).toBe(403);
    });

    it('public GET endpoints return data without auth', async () => {
      const { token } = await registerUser(ctx.container, 'owner@test.com', 'Owner');
      const est = await ctx.request
        .post('/establishments')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'My Salon' });

      const estCode = est.body.id;

      const listRes = await ctx.request.get('/establishments');
      expect(listRes.status).toBe(200);

      const findRes = await ctx.request.get(`/establishments/${estCode}`);
      expect(findRes.status).toBe(200);
    });
  });
});

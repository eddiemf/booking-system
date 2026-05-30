import { beforeEach, describe, expect, it } from 'vitest';
import { registerUser } from '../helpers/auth';
import { createTestContext } from '../setup';

describe('Establishments Feature', () => {
  const ctx = createTestContext();

  beforeEach(() => {
    ctx.clearAllRepositories();
  });

  // ── Create Establishment ──

  describe('Create Establishment', () => {
    it('POST /establishments — returns 201 with DTO for valid name', async () => {
      const { token } = await registerUser(ctx.container, 'alice@test.com', 'Alice');

      const res = await ctx.request
        .post('/establishments')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'My Salon' });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe('My Salon');
      expect(res.body.timezone).toBe('UTC');
    });

    it('POST /establishments — returns 400 when name is missing', async () => {
      const { token } = await registerUser(ctx.container, 'alice@test.com', 'Alice');

      const res = await ctx.request
        .post('/establishments')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('ValidationError');
    });

    it('POST /establishments — returns 400 for invalid timezone', async () => {
      const { token } = await registerUser(ctx.container, 'alice@test.com', 'Alice');

      const res = await ctx.request
        .post('/establishments')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Salon', timezone: 'invalid' });

      expect(res.status).toBe(400);
    });

    it('POST /establishments — returns 201 with specified timezone', async () => {
      const { token } = await registerUser(ctx.container, 'alice@test.com', 'Alice');

      const res = await ctx.request
        .post('/establishments')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Warsaw Salon', timezone: 'Europe/Warsaw' });

      expect(res.status).toBe(201);
      expect(res.body.timezone).toBe('Europe/Warsaw');
    });

    it('POST /establishments — returns 401 without auth token', async () => {
      const res = await ctx.request.post('/establishments').send({ name: 'Salon' });

      expect(res.status).toBe(401);
    });
  });

  // ── List Establishments ──

  describe('List Establishments', () => {
    it('GET /establishments — returns list', async () => {
      const { token } = await registerUser(ctx.container, 'alice@test.com', 'Alice');
      await ctx.request
        .post('/establishments')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Salon 1' });
      await ctx.request
        .post('/establishments')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Salon 2' });

      const res = await ctx.request.get('/establishments');

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
    });

    it('GET /establishments — returns empty array when none exist', async () => {
      const res = await ctx.request.get('/establishments');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('GET /establishments — supports pagination', async () => {
      const { token } = await registerUser(ctx.container, 'alice@test.com', 'Alice');
      for (let i = 0; i < 5; i++) {
        await ctx.request
          .post('/establishments')
          .set('Authorization', `Bearer ${token}`)
          .send({ name: `Salon ${i}` });
      }

      const page1 = await ctx.request.get('/establishments?limit=2&offset=0');
      expect(page1.status).toBe(200);
      expect(page1.body.length).toBe(2);

      const page2 = await ctx.request.get('/establishments?limit=2&offset=2');
      expect(page2.status).toBe(200);
      expect(page2.body.length).toBe(2);

      const page3 = await ctx.request.get('/establishments?limit=2&offset=4');
      expect(page3.status).toBe(200);
      expect(page3.body.length).toBe(1); // last page has 1
    });

    it('GET /establishments — returns 400 for negative limit', async () => {
      const res = await ctx.request.get('/establishments?limit=-5');
      expect(res.status).toBe(400);
    });

    it('GET /establishments — returns 400 for non-numeric limit', async () => {
      const res = await ctx.request.get('/establishments?limit=abc');
      expect(res.status).toBe(400);
    });

    it('GET /establishments — returns 400 for negative offset', async () => {
      const res = await ctx.request.get('/establishments?offset=-1');
      expect(res.status).toBe(400);
    });
  });

  // ── Find Establishment ──

  describe('Find Establishment', () => {
    it('GET /establishments/:code — returns 200 with DTO', async () => {
      const { token } = await registerUser(ctx.container, 'alice@test.com', 'Alice');
      const createRes = await ctx.request
        .post('/establishments')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Find Me' });

      const res = await ctx.request.get(`/establishments/${createRes.body.id}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Find Me');
    });

    it('GET /establishments/:code — returns 404 when not found', async () => {
      const res = await ctx.request.get('/establishments/nonexistent');

      expect(res.status).toBe(404);
    });

    it('GET /establishments/:code — returns 404 for non-existent code', async () => {
      const res = await ctx.request.get('/establishments/nonexistent-but-not-empty');

      expect(res.status).toBe(404);
    });
  });

  // ── Update Establishment ──

  describe('Update Establishment', () => {
    it('PUT /establishments/:code — returns 200 with updated DTO', async () => {
      const { token } = await registerUser(ctx.container, 'alice@test.com', 'Alice');
      const createRes = await ctx.request
        .post('/establishments')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Old Name' });

      const res = await ctx.request
        .put(`/establishments/${createRes.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New Name' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('New Name');
    });

    it('PUT /establishments/:code — returns 400 when name is empty', async () => {
      const { token } = await registerUser(ctx.container, 'alice@test.com', 'Alice');
      const createRes = await ctx.request
        .post('/establishments')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Salon' });

      const res = await ctx.request
        .put(`/establishments/${createRes.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: '' });

      expect(res.status).toBe(400);
    });

    it('PUT /establishments/:code — returns 404 when not found', async () => {
      const { token } = await registerUser(ctx.container, 'alice@test.com', 'Alice');

      const res = await ctx.request
        .put('/establishments/nonexistent')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New Name' });

      expect(res.status).toBe(404);
    });

    it('PUT /establishments/:code — returns 403 when not owner', async () => {
      const { token: ownerToken } = await registerUser(ctx.container, 'owner@test.com', 'Owner');
      const createRes = await ctx.request
        .post('/establishments')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'My Salon' });

      const { token: otherToken } = await registerUser(ctx.container, 'other@test.com', 'Other');
      const res = await ctx.request
        .put(`/establishments/${createRes.body.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ name: 'Hacked' });

      expect(res.status).toBe(403);
    });

    it('PUT /establishments/:code — returns 400 for invalid timezone', async () => {
      const { token } = await registerUser(ctx.container, 'alice@test.com', 'Alice');
      const createRes = await ctx.request
        .post('/establishments')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Salon' });

      const res = await ctx.request
        .put(`/establishments/${createRes.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Salon', timezone: 'bogus' });

      expect(res.status).toBe(400);
    });

    it('PUT /establishments/:code — updates timezone', async () => {
      const { token } = await registerUser(ctx.container, 'alice@test.com', 'Alice');
      const createRes = await ctx.request
        .post('/establishments')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Salon' });

      const res = await ctx.request
        .put(`/establishments/${createRes.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Salon', timezone: 'America/New_York' });

      expect(res.status).toBe(200);
      expect(res.body.timezone).toBe('America/New_York');
    });
  });

  // ── Delete Establishment ──

  describe('Delete Establishment', () => {
    it('DELETE /establishments/:code — returns 204', async () => {
      const { token } = await registerUser(ctx.container, 'alice@test.com', 'Alice');
      const createRes = await ctx.request
        .post('/establishments')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Delete Me' });

      const delRes = await ctx.request
        .delete(`/establishments/${createRes.body.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(delRes.status).toBe(204);

      // Verify it's gone
      const getRes = await ctx.request.get(`/establishments/${createRes.body.id}`);
      expect(getRes.status).toBe(404);
    });

    it('DELETE /establishments/:code — returns 404 when not found', async () => {
      const { token } = await registerUser(ctx.container, 'alice@test.com', 'Alice');

      const res = await ctx.request
        .delete('/establishments/nonexistent')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('DELETE /establishments/:code — returns 403 when not owner', async () => {
      const { token: ownerToken } = await registerUser(ctx.container, 'owner@test.com', 'Owner');
      const createRes = await ctx.request
        .post('/establishments')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'My Salon' });

      const { token: otherToken } = await registerUser(ctx.container, 'other@test.com', 'Other');
      const res = await ctx.request
        .delete(`/establishments/${createRes.body.id}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(403);
    });
  });
});

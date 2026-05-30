import { beforeEach, describe, expect, it } from 'vitest';
import { registerUser } from '../helpers';
import { createTestContext } from '../setup';

describe('Resources Feature', () => {
  const ctx = createTestContext();

  beforeEach(() => {
    ctx.clearAllRepositories();
  });

  async function createOwnerAndEstablishment() {
    const { user, token } = await registerUser(ctx.container, 'owner@test.com', 'Owner');
    const estRes = await ctx.request
      .post('/establishments')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'My Salon' });
    return { user, token, estCode: estRes.body.id };
  }

  // ── Create Resource ──

  describe('Create Resource', () => {
    it('POST /establishments/:estCode/resources — returns 201 with DTO', async () => {
      const { token, estCode } = await createOwnerAndEstablishment();

      const res = await ctx.request
        .post(`/establishments/${estCode}/resources`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Alice' });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe('Alice');
      expect(res.body.establishmentCode).toBe(estCode);
    });

    it('POST /establishments/:estCode/resources — returns 400 for missing name', async () => {
      const { token, estCode } = await createOwnerAndEstablishment();

      const res = await ctx.request
        .post(`/establishments/${estCode}/resources`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('POST /establishments/:estCode/resources — returns 404 for non-existent est', async () => {
      const { token } = await registerUser(ctx.container, 'alice@test.com', 'Alice');

      const res = await ctx.request
        .post('/establishments/nonexistent/resources')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Alice' });

      expect(res.status).toBe(404);
    });
  });

  // ── List Resources ──

  describe('List Resources', () => {
    it('GET /establishments/:estCode/resources — returns list', async () => {
      const { token, estCode } = await createOwnerAndEstablishment();
      await ctx.request
        .post(`/establishments/${estCode}/resources`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Alice' });
      await ctx.request
        .post(`/establishments/${estCode}/resources`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Bob' });

      const res = await ctx.request.get(`/establishments/${estCode}/resources`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
    });

    it('GET /establishments/:estCode/resources — returns empty array', async () => {
      const { estCode } = await createOwnerAndEstablishment();

      const res = await ctx.request.get(`/establishments/${estCode}/resources`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  // ── Update Resource ──

  describe('Update Resource', () => {
    it('PUT /establishments/:estCode/resources/:code — updates name', async () => {
      const { token, estCode } = await createOwnerAndEstablishment();
      const createRes = await ctx.request
        .post(`/establishments/${estCode}/resources`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Old Name' });

      const res = await ctx.request
        .put(`/establishments/${estCode}/resources/${createRes.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New Name' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('New Name');
    });

    it('PUT /establishments/:estCode/resources/:code — returns 400 for empty name', async () => {
      const { token, estCode } = await createOwnerAndEstablishment();
      const createRes = await ctx.request
        .post(`/establishments/${estCode}/resources`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Alice' });

      const res = await ctx.request
        .put(`/establishments/${estCode}/resources/${createRes.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: '' });

      expect(res.status).toBe(400);
    });

    it('PUT /establishments/:estCode/resources/:code — returns 404 when not found', async () => {
      const { token, estCode } = await createOwnerAndEstablishment();

      const res = await ctx.request
        .put(`/establishments/${estCode}/resources/nonexistent`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New' });

      expect(res.status).toBe(404);
    });
  });

  // ── Delete Resource ──

  describe('Delete Resource', () => {
    it('DELETE /establishments/:estCode/resources/:code — returns 204', async () => {
      const { token, estCode } = await createOwnerAndEstablishment();
      const createRes = await ctx.request
        .post(`/establishments/${estCode}/resources`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'To Delete' });

      const res = await ctx.request
        .delete(`/establishments/${estCode}/resources/${createRes.body.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(204);
    });

    it('DELETE /establishments/:estCode/resources/:code — returns 404 when not found', async () => {
      const { token, estCode } = await createOwnerAndEstablishment();

      const res = await ctx.request
        .delete(`/establishments/${estCode}/resources/nonexistent`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });
});

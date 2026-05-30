import { beforeEach, describe, expect, it } from 'vitest';
import { registerUser } from '../helpers/auth';
import { createTestContext } from '../setup';

describe('Services Feature', () => {
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

  async function setupServiceOfferingScenario() {
    const { user, token, estCode } = await createOwnerAndEstablishment();
    const svcRes = await ctx.request
      .post(`/establishments/${estCode}/services`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Haircut', duration: 60 });
    const resRes = await ctx.request
      .post(`/establishments/${estCode}/resources`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Alice' });
    return { user, token, estCode, svcCode: svcRes.body.id, resCode: resRes.body.id };
  }

  // ── Create Service ──

  describe('Create Service', () => {
    it('POST /establishments/:estCode/services — returns 201 with DTO', async () => {
      const { token, estCode } = await createOwnerAndEstablishment();

      const res = await ctx.request
        .post(`/establishments/${estCode}/services`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Haircut', description: 'Basic', duration: 30 });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe('Haircut');
      expect(res.body.description).toBe('Basic');
      expect(res.body.duration).toBe(30);
      expect(res.body.establishmentCode).toBe(estCode);
    });

    it('POST /establishments/:estCode/services — defaults description to ""', async () => {
      const { token, estCode } = await createOwnerAndEstablishment();

      const res = await ctx.request
        .post(`/establishments/${estCode}/services`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Haircut', duration: 30 });

      expect(res.status).toBe(201);
      expect(res.body.description).toBe('');
    });

    it('POST /establishments/:estCode/services — returns 400 for missing name', async () => {
      const { token, estCode } = await createOwnerAndEstablishment();

      const res = await ctx.request
        .post(`/establishments/${estCode}/services`)
        .set('Authorization', `Bearer ${token}`)
        .send({ duration: 30 });

      expect(res.status).toBe(400);
    });

    it('POST /establishments/:estCode/services — returns 400 for zero duration', async () => {
      const { token, estCode } = await createOwnerAndEstablishment();

      const res = await ctx.request
        .post(`/establishments/${estCode}/services`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test', duration: 0 });

      expect(res.status).toBe(400);
    });

    it('POST /establishments/:estCode/services — returns 404 for non-existent est', async () => {
      const { token } = await registerUser(ctx.container, 'alice@test.com', 'Alice');

      const res = await ctx.request
        .post('/establishments/nonexistent/services')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test', duration: 30 });

      expect(res.status).toBe(404);
    });
  });

  // ── List Services ──

  describe('List Services', () => {
    it('GET /establishments/:estCode/services — returns list', async () => {
      const { token, estCode } = await createOwnerAndEstablishment();
      await ctx.request
        .post(`/establishments/${estCode}/services`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Haircut', duration: 30 });
      await ctx.request
        .post(`/establishments/${estCode}/services`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Massage', duration: 60 });

      const res = await ctx.request.get(`/establishments/${estCode}/services`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
    });

    it('GET /establishments/:estCode/services — returns empty array when none', async () => {
      const { estCode } = await createOwnerAndEstablishment();

      const res = await ctx.request.get(`/establishments/${estCode}/services`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('GET /establishments/:estCode/services — only returns services for that est', async () => {
      const { token, estCode } = await createOwnerAndEstablishment();
      await ctx.request
        .post(`/establishments/${estCode}/services`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Haircut', duration: 30 });

      const res = await ctx.request.get(`/establishments/other-est/services`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  // ── Get Service by Code ──

  describe('Get Service by Code', () => {
    it('GET /establishments/:estCode/services/:code — returns 200', async () => {
      const { token, estCode } = await createOwnerAndEstablishment();
      const createRes = await ctx.request
        .post(`/establishments/${estCode}/services`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Haircut', duration: 30 });

      const res = await ctx.request.get(`/establishments/${estCode}/services/${createRes.body.id}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Haircut');
    });

    it('GET /establishments/:estCode/services/:code — returns 404 when not found', async () => {
      const { estCode } = await createOwnerAndEstablishment();

      const res = await ctx.request.get(`/establishments/${estCode}/services/nonexistent`);

      expect(res.status).toBe(404);
    });
  });

  // ── Update Service ──

  describe('Update Service', () => {
    it('PUT /establishments/:estCode/services/:code — updates fields', async () => {
      const { token, estCode } = await createOwnerAndEstablishment();
      const createRes = await ctx.request
        .post(`/establishments/${estCode}/services`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Old', description: 'Old desc', duration: 30 });

      const res = await ctx.request
        .put(`/establishments/${estCode}/services/${createRes.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New', description: 'New desc', duration: 45 });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('New');
      expect(res.body.description).toBe('New desc');
      expect(res.body.duration).toBe(45);
    });

    it('PUT /establishments/:estCode/services/:code — returns 400 for empty name', async () => {
      const { token, estCode } = await createOwnerAndEstablishment();
      const createRes = await ctx.request
        .post(`/establishments/${estCode}/services`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Haircut', duration: 30 });

      const res = await ctx.request
        .put(`/establishments/${estCode}/services/${createRes.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: '', duration: 30 });

      expect(res.status).toBe(400);
    });

    it('PUT /establishments/:estCode/services/:code — returns 404 when not found', async () => {
      const { token, estCode } = await createOwnerAndEstablishment();

      const res = await ctx.request
        .put(`/establishments/${estCode}/services/nonexistent`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New', duration: 30 });

      expect(res.status).toBe(404);
    });
  });

  // ── Delete Service ──

  describe('Delete Service', () => {
    it('DELETE /establishments/:estCode/services/:code — returns 204', async () => {
      const { token, estCode } = await createOwnerAndEstablishment();
      const createRes = await ctx.request
        .post(`/establishments/${estCode}/services`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'To Delete', duration: 30 });

      const res = await ctx.request
        .delete(`/establishments/${estCode}/services/${createRes.body.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(204);
    });

    it('DELETE /establishments/:estCode/services/:code — returns 404 when not found', async () => {
      const { token, estCode } = await createOwnerAndEstablishment();

      const res = await ctx.request
        .delete(`/establishments/${estCode}/services/nonexistent`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  // ── Create Service Offering ──

  describe('Create Service Offering', () => {
    it('POST .../service-offerings — returns 201 with DTO (all fields)', async () => {
      const { token, estCode, svcCode, resCode } = await setupServiceOfferingScenario();

      const res = await ctx.request
        .post(`/establishments/${estCode}/services/${svcCode}/service-offerings`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          resourceCode: resCode,
          duration: 60,
          slotInterval: 30,
          maxCapacity: 2,
          price: 5000,
        });

      expect(res.status).toBe(201);
      expect(res.body.serviceCode).toBe(svcCode);
      expect(res.body.resourceCode).toBe(resCode);
      expect(res.body.maxCapacity).toBe(2);
      expect(res.body.duration).toBe(60);
      expect(res.body.slotInterval).toBe(30);
      expect(res.body.price).toBe(5000);
    });

    it('POST .../service-offerings — returns 201 with defaults', async () => {
      const { token, estCode, svcCode, resCode } = await setupServiceOfferingScenario();

      const res = await ctx.request
        .post(`/establishments/${estCode}/services/${svcCode}/service-offerings`)
        .set('Authorization', `Bearer ${token}`)
        .send({ resourceCode: resCode, duration: 30, slotInterval: 30 });

      expect(res.status).toBe(201);
      expect(res.body.maxCapacity).toBe(1);
      expect(res.body.price).toBe(0);
    });

    it('POST .../service-offerings — returns 404 for non-existent service', async () => {
      const { token, estCode, resCode } = await setupServiceOfferingScenario();

      const res = await ctx.request
        .post(`/establishments/${estCode}/services/nonexistent/service-offerings`)
        .set('Authorization', `Bearer ${token}`)
        .send({ resourceCode: resCode, duration: 30, slotInterval: 30 });

      expect(res.status).toBe(404);
    });

    it('POST .../service-offerings — returns 409 when already assigned', async () => {
      const { token, estCode, svcCode, resCode } = await setupServiceOfferingScenario();
      await ctx.request
        .post(`/establishments/${estCode}/services/${svcCode}/service-offerings`)
        .set('Authorization', `Bearer ${token}`)
        .send({ resourceCode: resCode, duration: 30, slotInterval: 30 });

      const res = await ctx.request
        .post(`/establishments/${estCode}/services/${svcCode}/service-offerings`)
        .set('Authorization', `Bearer ${token}`)
        .send({ resourceCode: resCode, duration: 30, slotInterval: 30 });

      expect(res.status).toBe(409);
    });

    it('POST .../service-offerings — returns 400 for non-positive duration', async () => {
      const { token, estCode, svcCode, resCode } = await setupServiceOfferingScenario();

      const res = await ctx.request
        .post(`/establishments/${estCode}/services/${svcCode}/service-offerings`)
        .set('Authorization', `Bearer ${token}`)
        .send({ resourceCode: resCode, duration: 0, slotInterval: 30 });

      expect(res.status).toBe(400);
    });

    it('POST .../service-offerings — returns 400 for negative duration', async () => {
      const { token, estCode, svcCode, resCode } = await setupServiceOfferingScenario();

      const res = await ctx.request
        .post(`/establishments/${estCode}/services/${svcCode}/service-offerings`)
        .set('Authorization', `Bearer ${token}`)
        .send({ resourceCode: resCode, duration: -5, slotInterval: 30 });

      expect(res.status).toBe(400);
    });

    it('POST .../service-offerings — returns 403 when not owner', async () => {
      const { token, estCode, svcCode, resCode } = await setupServiceOfferingScenario();
      const other = await registerUser(ctx.container, 'other@test.com', 'Other');

      const res = await ctx.request
        .post(`/establishments/${estCode}/services/${svcCode}/service-offerings`)
        .set('Authorization', `Bearer ${other.token}`)
        .send({ resourceCode: resCode, duration: 30, slotInterval: 30 });

      expect(res.status).toBe(403);
    });
  });

  // ── Delete Service Offering ──

  describe('Delete Service Offering', () => {
    it('DELETE .../service-offerings/:resCode — returns 204', async () => {
      const { token, estCode, svcCode, resCode } = await setupServiceOfferingScenario();
      // Create the offering first
      await ctx.request
        .post(`/establishments/${estCode}/services/${svcCode}/service-offerings`)
        .set('Authorization', `Bearer ${token}`)
        .send({ resourceCode: resCode, duration: 30, slotInterval: 30 });

      const res = await ctx.request
        .delete(`/establishments/${estCode}/services/${svcCode}/service-offerings/${resCode}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(204);
    });

    it('DELETE .../service-offerings/:resCode — returns 404 when not found', async () => {
      const { token, estCode, svcCode } = await setupServiceOfferingScenario();

      const res = await ctx.request
        .delete(`/establishments/${estCode}/services/${svcCode}/service-offerings/nonexistent`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });
});

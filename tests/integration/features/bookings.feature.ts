import { beforeEach, describe, expect, it } from 'vitest';
import { seedBooking, setupFullScenario } from '../helpers';
import { registerUser } from '../helpers/auth';
import { createTestContext } from '../setup';

describe('Bookings Feature', () => {
  const ctx = createTestContext();

  beforeEach(() => {
    ctx.clearAllRepositories();
  });

  // ── Create Booking ──

  describe('Create Booking', () => {
    it('POST /bookings — returns 201 with DTO for valid data', async () => {
      const { user, token, establishment, resource, service } = await setupFullScenario(
        ctx.container
      );

      const res = await ctx.request.post('/bookings').set('Authorization', `Bearer ${token}`).send({
        serviceCode: service.code,
        resourceCode: resource.code,
        establishmentCode: establishment.code,
        date: '2026-06-15',
        startTime: '09:00',
      });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.serviceCode).toBe(service.code);
      expect(res.body.resourceCode).toBe(resource.code);
      expect(res.body.establishmentCode).toBe(establishment.code);
      expect(res.body.status).toBe('confirmed');
      expect(res.body.serviceDuration).toBe(60);
    });

    it('POST /bookings — returns 404 for non-existent service', async () => {
      const { user, token, establishment, resource, service } = await setupFullScenario(
        ctx.container
      );

      const res = await ctx.request.post('/bookings').set('Authorization', `Bearer ${token}`).send({
        serviceCode: 'nonexistent',
        resourceCode: resource.code,
        establishmentCode: establishment.code,
        date: '2026-06-15',
        startTime: '09:00',
      });

      expect(res.status).toBe(404);
    });

    it('POST /bookings — returns 404 for non-existent resource', async () => {
      const { user, token, establishment, resource, service } = await setupFullScenario(
        ctx.container
      );

      const res = await ctx.request.post('/bookings').set('Authorization', `Bearer ${token}`).send({
        serviceCode: service.code,
        resourceCode: 'nonexistent',
        establishmentCode: establishment.code,
        date: '2026-06-15',
        startTime: '09:00',
      });

      expect(res.status).toBe(404);
    });

    it('POST /bookings — returns 409 when resource already booked (same time)', async () => {
      const { user, token, establishment, resource, service } = await setupFullScenario(
        ctx.container
      );

      // Create first booking
      await ctx.request.post('/bookings').set('Authorization', `Bearer ${token}`).send({
        serviceCode: service.code,
        resourceCode: resource.code,
        establishmentCode: establishment.code,
        date: '2026-06-15',
        startTime: '09:00',
      });

      // Try to book the same slot
      const res = await ctx.request.post('/bookings').set('Authorization', `Bearer ${token}`).send({
        serviceCode: service.code,
        resourceCode: resource.code,
        establishmentCode: establishment.code,
        date: '2026-06-15',
        startTime: '09:00',
      });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('ConflictError');
    });

    it('POST /bookings — returns 409 when resource booked (overlapping time)', async () => {
      const { user, token, establishment, resource, service } = await setupFullScenario(
        ctx.container
      );

      // Book 09:00-10:00
      await ctx.request.post('/bookings').set('Authorization', `Bearer ${token}`).send({
        serviceCode: service.code,
        resourceCode: resource.code,
        establishmentCode: establishment.code,
        date: '2026-06-15',
        startTime: '09:00',
      });

      // Try to book 09:30-10:30 (overlaps)
      const res = await ctx.request.post('/bookings').set('Authorization', `Bearer ${token}`).send({
        serviceCode: service.code,
        resourceCode: resource.code,
        establishmentCode: establishment.code,
        date: '2026-06-15',
        startTime: '09:30',
      });

      expect(res.status).toBe(409);
    });

    it('POST /bookings — returns 201 when owner books their own establishment', async () => {
      const { user, token, establishment, resource, service } = await setupFullScenario(
        ctx.container
      );

      const res = await ctx.request.post('/bookings').set('Authorization', `Bearer ${token}`).send({
        serviceCode: service.code,
        resourceCode: resource.code,
        establishmentCode: establishment.code,
        date: '2026-06-15',
        startTime: '10:00',
      });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('confirmed');
    });
  });

  // ── Get Booking ──

  describe('Get Booking', () => {
    it('GET /bookings/:code — returns 200 with DTO', async () => {
      const { user, token, establishment, resource, service } = await setupFullScenario(
        ctx.container
      );
      const createRes = await ctx.request
        .post('/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          serviceCode: service.code,
          resourceCode: resource.code,
          establishmentCode: establishment.code,
          date: '2026-06-15',
          startTime: '09:00',
        });

      const res = await ctx.request
        .get(`/bookings/${createRes.body.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(createRes.body.id);
      expect(res.body.status).toBe('confirmed');
    });

    it('GET /bookings/:code — returns 403 when not owner', async () => {
      const { user, token, establishment, resource, service } = await setupFullScenario(
        ctx.container
      );
      const createRes = await ctx.request
        .post('/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          serviceCode: service.code,
          resourceCode: resource.code,
          establishmentCode: establishment.code,
          date: '2026-06-15',
          startTime: '09:00',
        });

      const other = await registerUser(ctx.container, 'other@test.com', 'Other');
      const res = await ctx.request
        .get(`/bookings/${createRes.body.id}`)
        .set('Authorization', `Bearer ${other.token}`);

      expect(res.status).toBe(403);
    });

    it('GET /bookings/:code — returns 404 when not found', async () => {
      const { token } = await registerUser(ctx.container, 'alice@test.com', 'Alice');

      const res = await ctx.request
        .get('/bookings/nonexistent')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  // ── List Bookings ──

  describe('List Bookings', () => {
    it('GET /bookings — returns own bookings as customer', async () => {
      const { user, token, establishment, resource, service } = await setupFullScenario(
        ctx.container
      );
      await ctx.request.post('/bookings').set('Authorization', `Bearer ${token}`).send({
        serviceCode: service.code,
        resourceCode: resource.code,
        establishmentCode: establishment.code,
        date: '2026-06-15',
        startTime: '09:00',
      });

      const res = await ctx.request.get('/bookings').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].customerCode).toBe(user.code);
    });

    it('GET /bookings — returns empty array when none', async () => {
      const { token } = await registerUser(ctx.container, 'alice@test.com', 'Alice');

      const res = await ctx.request.get('/bookings').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  // ── Cancel Booking ──

  describe('Cancel Booking', () => {
    it('DELETE /bookings/:code — cancels future booking, returns 200', async () => {
      const { user, token, establishment, resource, service } = await setupFullScenario(
        ctx.container
      );
      const createRes = await ctx.request
        .post('/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          serviceCode: service.code,
          resourceCode: resource.code,
          establishmentCode: establishment.code,
          date: '2026-06-15',
          startTime: '09:00',
        });

      const res = await ctx.request
        .delete(`/bookings/${createRes.body.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('cancelled');
    });

    it('DELETE /bookings/:code — returns 403 when not owner', async () => {
      const { user, token, establishment, resource, service } = await setupFullScenario(
        ctx.container
      );
      const createRes = await ctx.request
        .post('/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          serviceCode: service.code,
          resourceCode: resource.code,
          establishmentCode: establishment.code,
          date: '2026-06-15',
          startTime: '09:00',
        });

      const other = await registerUser(ctx.container, 'other@test.com', 'Other');
      const res = await ctx.request
        .delete(`/bookings/${createRes.body.id}`)
        .set('Authorization', `Bearer ${other.token}`);

      expect(res.status).toBe(403);
    });

    it('DELETE /bookings/:code — returns 400 when already cancelled', async () => {
      const { user, token, establishment, resource, service } = await setupFullScenario(
        ctx.container
      );
      const createRes = await ctx.request
        .post('/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          serviceCode: service.code,
          resourceCode: resource.code,
          establishmentCode: establishment.code,
          date: '2026-06-15',
          startTime: '09:00',
        });

      // Cancel once
      await ctx.request
        .delete(`/bookings/${createRes.body.id}`)
        .set('Authorization', `Bearer ${token}`);

      // Cancel again
      const res = await ctx.request
        .delete(`/bookings/${createRes.body.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
    });

    it('DELETE /bookings/:code — returns 404 when not found', async () => {
      const { token } = await registerUser(ctx.container, 'alice@test.com', 'Alice');

      const res = await ctx.request
        .delete('/bookings/nonexistent')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });
});

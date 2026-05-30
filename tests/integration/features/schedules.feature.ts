import { beforeEach, describe, expect, it } from 'vitest';
import { registerUser } from '../helpers/auth';
import { createTestContext } from '../setup';

describe('Schedules Feature', () => {
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
    const resRes = await ctx.request
      .post(`/establishments/${estRes.body.id}/resources`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Alice' });
    return { user, token, estCode: estRes.body.id, resCode: resRes.body.id };
  }

  describe('Set Schedule for a Resource', () => {
    it('PUT .../schedule — sets schedule with valid entry', async () => {
      const { token, estCode, resCode } = await createOwnerAndEstablishment();

      const res = await ctx.request
        .put(`/establishments/${estCode}/resources/${resCode}/schedule`)
        .set('Authorization', `Bearer ${token}`)
        .send({ entries: [{ dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }] });

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].dayOfWeek).toBe(1);
      expect(res.body[0].startTime).toBe('09:00');
      expect(res.body[0].endTime).toBe('17:00');
    });

    it('PUT .../schedule — multiple entries for different days', async () => {
      const { token, estCode, resCode } = await createOwnerAndEstablishment();

      const res = await ctx.request
        .put(`/establishments/${estCode}/resources/${resCode}/schedule`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          entries: [
            { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
            { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
    });

    it('PUT .../schedule — multiple windows on same day', async () => {
      const { token, estCode, resCode } = await createOwnerAndEstablishment();

      const res = await ctx.request
        .put(`/establishments/${estCode}/resources/${resCode}/schedule`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          entries: [
            { dayOfWeek: 1, startTime: '09:00', endTime: '12:00' },
            { dayOfWeek: 1, startTime: '13:00', endTime: '17:00' },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
    });

    it('PUT .../schedule — clears schedule with empty array', async () => {
      const { token, estCode, resCode } = await createOwnerAndEstablishment();
      // Set some schedule first
      await ctx.request
        .put(`/establishments/${estCode}/resources/${resCode}/schedule`)
        .set('Authorization', `Bearer ${token}`)
        .send({ entries: [{ dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }] });

      // Clear it
      const res = await ctx.request
        .put(`/establishments/${estCode}/resources/${resCode}/schedule`)
        .set('Authorization', `Bearer ${token}`)
        .send({ entries: [] });

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('PUT .../schedule — replaces existing schedule entirely', async () => {
      const { token, estCode, resCode } = await createOwnerAndEstablishment();
      await ctx.request
        .put(`/establishments/${estCode}/resources/${resCode}/schedule`)
        .set('Authorization', `Bearer ${token}`)
        .send({ entries: [{ dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }] });

      const res = await ctx.request
        .put(`/establishments/${estCode}/resources/${resCode}/schedule`)
        .set('Authorization', `Bearer ${token}`)
        .send({ entries: [{ dayOfWeek: 3, startTime: '10:00', endTime: '16:00' }] });

      expect(res.body.length).toBe(1);
      expect(res.body[0].dayOfWeek).toBe(3);
      expect(res.body[0].startTime).toBe('10:00');
    });

    it('PUT .../schedule — returns 400 for invalid dayOfWeek', async () => {
      const { token, estCode, resCode } = await createOwnerAndEstablishment();

      const res = await ctx.request
        .put(`/establishments/${estCode}/resources/${resCode}/schedule`)
        .set('Authorization', `Bearer ${token}`)
        .send({ entries: [{ dayOfWeek: 7, startTime: '09:00', endTime: '17:00' }] });

      expect(res.status).toBe(400);
    });

    it('PUT .../schedule — returns 400 when endTime equals startTime', async () => {
      const { token, estCode, resCode } = await createOwnerAndEstablishment();

      const res = await ctx.request
        .put(`/establishments/${estCode}/resources/${resCode}/schedule`)
        .set('Authorization', `Bearer ${token}`)
        .send({ entries: [{ dayOfWeek: 1, startTime: '09:00', endTime: '09:00' }] });

      expect(res.status).toBe(400);
    });

    it('PUT .../schedule — returns 400 when endTime before startTime', async () => {
      const { token, estCode, resCode } = await createOwnerAndEstablishment();

      const res = await ctx.request
        .put(`/establishments/${estCode}/resources/${resCode}/schedule`)
        .set('Authorization', `Bearer ${token}`)
        .send({ entries: [{ dayOfWeek: 1, startTime: '17:00', endTime: '09:00' }] });

      expect(res.status).toBe(400);
    });

    it('PUT .../schedule — returns 404 for non-existent resource', async () => {
      const { token, estCode } = await createOwnerAndEstablishment();

      const res = await ctx.request
        .put(`/establishments/${estCode}/resources/nonexistent/schedule`)
        .set('Authorization', `Bearer ${token}`)
        .send({ entries: [{ dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }] });

      expect(res.status).toBe(404);
    });

    it('PUT .../schedule — returns 403 when not owner', async () => {
      const { token, estCode, resCode } = await createOwnerAndEstablishment();
      const other = await registerUser(ctx.container, 'other@test.com', 'Other');

      const res = await ctx.request
        .put(`/establishments/${estCode}/resources/${resCode}/schedule`)
        .set('Authorization', `Bearer ${other.token}`)
        .send({ entries: [{ dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }] });

      expect(res.status).toBe(403);
    });
  });
});

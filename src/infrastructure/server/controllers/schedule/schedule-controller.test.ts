import { NotFoundError, ValidationError } from '@app/domain/errors';
import type { ScheduleDTO } from '@app/dtos';
import type { SetSchedule } from '@app/use-cases';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { getMockReq, getMockRes } from 'vitest-mock-express';
import { mock } from 'vitest-mock-extended';
import { ScheduleController } from './schedule-controller';

describe('ScheduleController', () => {
  const setScheduleMock = mock<SetSchedule>();
  const controller = new ScheduleController(setScheduleMock);

  const resourceCode = 'res123';
  const validEntries = [{ dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }];
  const scheduleDTO: ScheduleDTO = {
    id: '1',
    resourceId: 'uuid-res',
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '17:00',
  };

  describe('set()', () => {
    it('returns 400 when resourceCode is empty', async () => {
      const { res } = getMockRes();
      const req = getMockReq({
        params: { resourceCode: '' },
        body: { entries: validEntries },
      });

      // @ts-expect-error
      await controller.set(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when entries is not an array', async () => {
      const { res } = getMockRes();
      const req = getMockReq({ params: { resourceCode }, body: { entries: 'invalid' } });

      // @ts-expect-error
      await controller.set(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when dayOfWeek is out of range', async () => {
      const { res } = getMockRes();
      const req = getMockReq({
        params: { resourceCode },
        body: { entries: [{ dayOfWeek: 7, startTime: '09:00', endTime: '17:00' }] },
      });

      // @ts-expect-error
      await controller.set(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when time range is invalid (domain validation)', async () => {
      setScheduleMock.execute.mockResolvedValue(
        fail(new ValidationError('endTime', 'Must be after startTime.'))
      );
      const { res } = getMockRes();
      const req = getMockReq({
        params: { resourceCode },
        body: { entries: [{ dayOfWeek: 1, startTime: '17:00', endTime: '09:00' }] },
      });

      // @ts-expect-error
      await controller.set(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 404 when resource does not exist', async () => {
      setScheduleMock.execute.mockResolvedValue(fail(new NotFoundError('Resource', resourceCode)));
      const { res } = getMockRes();
      const req = getMockReq({ params: { resourceCode }, body: { entries: validEntries } });

      // @ts-expect-error
      await controller.set(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 200 with schedule DTOs on success', async () => {
      setScheduleMock.execute.mockResolvedValue(ok([scheduleDTO]));
      const { res } = getMockRes();
      const req = getMockReq({ params: { resourceCode }, body: { entries: validEntries } });

      // @ts-expect-error
      await controller.set(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([scheduleDTO]);
    });

    it('returns 200 with empty array when entries is empty', async () => {
      setScheduleMock.execute.mockResolvedValue(ok([]));
      const { res } = getMockRes();
      const req = getMockReq({ params: { resourceCode }, body: { entries: [] } });

      // @ts-expect-error
      await controller.set(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('returns 500 when setSchedule throws', async () => {
      setScheduleMock.execute.mockRejectedValue(new Error('Unexpected'));
      const { res } = getMockRes();
      const req = getMockReq({ params: { resourceCode }, body: { entries: validEntries } });

      // @ts-expect-error
      await controller.set(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});

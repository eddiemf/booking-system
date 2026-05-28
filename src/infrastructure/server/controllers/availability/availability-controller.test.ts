import { NotFoundError, StorageError, ValidationError } from '@app/domain/errors';
import type { AvailabilitySlotDTO } from '@app/dtos';
import type { GetAvailability } from '@app/use-cases';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { getMockReq, getMockRes } from 'vitest-mock-express';
import { mock } from 'vitest-mock-extended';
import { AvailabilityController } from './availability-controller';

describe('AvailabilityController', () => {
  const getAvailabilityMock = mock<GetAvailability>();
  const controller = new AvailabilityController(getAvailabilityMock);

  const establishmentCode = 'est123';
  const serviceCode = 'svc123';
  const date = '2026-06-03';

  const slot: AvailabilitySlotDTO = {
    startTime: '09:00',
    endTime: '10:00',
    resourceCode: 'res123',
    resourceName: 'Alice',
    price: 0,
  };

  describe('getSlots()', () => {
    it('returns 400 when establishmentCode is empty', async () => {
      const { res } = getMockRes();
      const req = getMockReq({
        params: { establishmentCode: '', serviceCode },
        query: { date },
      });

      // @ts-expect-error
      await controller.getSlots(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when serviceCode is empty', async () => {
      const { res } = getMockRes();
      const req = getMockReq({
        params: { establishmentCode, serviceCode: '' },
        query: { date },
      });

      // @ts-expect-error
      await controller.getSlots(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when date is missing', async () => {
      const { res } = getMockRes();
      const req = getMockReq({
        params: { establishmentCode, serviceCode },
        query: {},
      });

      // @ts-expect-error
      await controller.getSlots(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when date format is invalid', async () => {
      const { res } = getMockRes();
      const req = getMockReq({
        params: { establishmentCode, serviceCode },
        query: { date: 'not-a-date' },
      });

      // @ts-expect-error
      await controller.getSlots(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when the use case returns validation error', async () => {
      getAvailabilityMock.execute.mockResolvedValue(
        fail(new ValidationError('date', 'Must not be in the past.'))
      );
      const { res } = getMockRes();
      const req = getMockReq({
        params: { establishmentCode, serviceCode },
        query: { date },
      });

      // @ts-expect-error
      await controller.getSlots(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 404 when service does not exist', async () => {
      getAvailabilityMock.execute.mockResolvedValue(
        fail(new NotFoundError('Service', serviceCode))
      );
      const { res } = getMockRes();
      const req = getMockReq({
        params: { establishmentCode, serviceCode },
        query: { date },
      });

      // @ts-expect-error
      await controller.getSlots(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 200 with availability slots on success', async () => {
      getAvailabilityMock.execute.mockResolvedValue(ok([slot]));
      const { res } = getMockRes();
      const req = getMockReq({
        params: { establishmentCode, serviceCode },
        query: { date },
      });

      // @ts-expect-error
      await controller.getSlots(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([slot]);
    });

    it('returns 500 on storage error', async () => {
      getAvailabilityMock.execute.mockResolvedValue(fail(new StorageError('DB error')));
      const { res } = getMockRes();
      const req = getMockReq({
        params: { establishmentCode, serviceCode },
        query: { date },
      });

      // @ts-expect-error
      await controller.getSlots(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('returns 500 when use case throws', async () => {
      getAvailabilityMock.execute.mockRejectedValue(new Error('Unexpected'));
      const { res } = getMockRes();
      const req = getMockReq({
        params: { establishmentCode, serviceCode },
        query: { date },
      });

      // @ts-expect-error
      await controller.getSlots(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});

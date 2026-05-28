import { ConflictError, NotFoundError, StorageError, ValidationError } from '@app/domain/errors';
import type { BookingDTO } from '@app/dtos';
import type { CancelBooking, CreateBooking, GetBooking, ListBookings } from '@app/use-cases';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { getMockReq, getMockRes } from 'vitest-mock-express';
import { mock } from 'vitest-mock-extended';
import { BookingController } from './booking-controller';

describe('BookingController', () => {
  const createBookingMock = mock<CreateBooking>();
  const getBookingMock = mock<GetBooking>();
  const listBookingsMock = mock<ListBookings>();
  const cancelBookingMock = mock<CancelBooking>();
  const controller = new BookingController(
    createBookingMock,
    getBookingMock,
    listBookingsMock,
    cancelBookingMock
  );

  const bookingDTO: BookingDTO = {
    id: 'bkg1',
    customerCode: 'usr123',
    customerName: 'Alice',
    serviceCode: 'svc1',
    serviceName: 'Haircut',
    resourceCode: 'res1',
    resourceName: 'Bob',
    establishmentCode: 'est123',
    startsAt: '2026-06-15T09:00:00Z',
    endsAt: '2026-06-15T10:00:00Z',
    status: 'confirmed',
  };

  const getAuthenticatedReq = (extra = {}) =>
    getMockReq({
      user: { userId: 'uuid-user', userCode: 'usr123', email: 'alice@example.com' },
      ...extra,
    });

  describe('create()', () => {
    const validBody = {
      serviceCode: 'svc1',
      resourceCode: 'res1',
      establishmentCode: 'est123',
      startsAt: '2026-06-15T09:00:00Z',
    };

    it('returns 400 when serviceCode is missing', async () => {
      const { res } = getMockRes();
      const req = getAuthenticatedReq({ body: { ...validBody, serviceCode: undefined } });

      // @ts-expect-error
      await controller.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 404 when service does not exist', async () => {
      createBookingMock.execute.mockResolvedValue(fail(new NotFoundError('Service', 'svc1')));
      const { res } = getMockRes();
      const req = getAuthenticatedReq({ body: validBody });

      // @ts-expect-error
      await controller.create(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 409 when resource is already booked', async () => {
      createBookingMock.execute.mockResolvedValue(
        fail(new ConflictError('Resource is already booked for this time slot.'))
      );
      const { res } = getMockRes();
      const req = getAuthenticatedReq({ body: validBody });

      // @ts-expect-error
      await controller.create(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('returns 201 with booking DTO on success', async () => {
      createBookingMock.execute.mockResolvedValue(ok(bookingDTO));
      const { res } = getMockRes();
      const req = getAuthenticatedReq({ body: validBody });

      // @ts-expect-error
      await controller.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(bookingDTO);
    });

    it('returns 500 on storage error', async () => {
      createBookingMock.execute.mockResolvedValue(fail(new StorageError('DB error')));
      const { res } = getMockRes();
      const req = getAuthenticatedReq({ body: validBody });

      // @ts-expect-error
      await controller.create(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('get()', () => {
    it('returns 404 when booking does not exist', async () => {
      getBookingMock.execute.mockResolvedValue(fail(new NotFoundError('Booking', 'bkg1')));
      const { res } = getMockRes();
      const req = getAuthenticatedReq({ params: { code: 'bkg1' } });

      // @ts-expect-error
      await controller.get(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 200 with booking DTO on success', async () => {
      getBookingMock.execute.mockResolvedValue(ok(bookingDTO));
      const { res } = getMockRes();
      const req = getAuthenticatedReq({ params: { code: 'bkg1' } });

      // @ts-expect-error
      await controller.get(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(bookingDTO);
    });

    it('returns 500 on storage error', async () => {
      getBookingMock.execute.mockResolvedValue(fail(new StorageError('DB error')));
      const { res } = getMockRes();
      const req = getAuthenticatedReq({ params: { code: 'bkg1' } });

      // @ts-expect-error
      await controller.get(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('list()', () => {
    it('returns 200 with list of bookings', async () => {
      listBookingsMock.execute.mockResolvedValue(ok([bookingDTO]));
      const { res } = getMockRes();
      const req = getAuthenticatedReq({});

      // @ts-expect-error
      await controller.list(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([bookingDTO]);
    });

    it('returns 200 with empty array when no bookings', async () => {
      listBookingsMock.execute.mockResolvedValue(ok([]));
      const { res } = getMockRes();
      const req = getAuthenticatedReq({});

      // @ts-expect-error
      await controller.list(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('returns 500 on storage error', async () => {
      listBookingsMock.execute.mockResolvedValue(fail(new StorageError('DB error')));
      const { res } = getMockRes();
      const req = getAuthenticatedReq({});

      // @ts-expect-error
      await controller.list(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('cancel()', () => {
    it('returns 404 when booking does not exist', async () => {
      cancelBookingMock.execute.mockResolvedValue(fail(new NotFoundError('Booking', 'bkg1')));
      const { res } = getMockRes();
      const req = getAuthenticatedReq({ params: { code: 'bkg1' } });

      // @ts-expect-error
      await controller.cancel(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 200 with cancelled booking DTO on success', async () => {
      cancelBookingMock.execute.mockResolvedValue(ok({ ...bookingDTO, status: 'cancelled' }));
      const { res } = getMockRes();
      const req = getAuthenticatedReq({ params: { code: 'bkg1' } });

      // @ts-expect-error
      await controller.cancel(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ ...bookingDTO, status: 'cancelled' });
    });

    it('returns 400 when booking is already cancelled', async () => {
      cancelBookingMock.execute.mockResolvedValue(
        fail(new ValidationError('status', 'Booking is already cancelled.'))
      );
      const { res } = getMockRes();
      const req = getAuthenticatedReq({ params: { code: 'bkg1' } });

      // @ts-expect-error
      await controller.cancel(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 500 on storage error', async () => {
      cancelBookingMock.execute.mockResolvedValue(fail(new StorageError('DB error')));
      const { res } = getMockRes();
      const req = getAuthenticatedReq({ params: { code: 'bkg1' } });

      // @ts-expect-error
      await controller.cancel(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});

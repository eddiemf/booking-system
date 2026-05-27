import { ConflictError, NotFoundError, StorageError, ValidationError } from '@app/domain/errors';
import type {
  CreateService,
  DeleteService,
  FindService,
  ListServices,
  UpdateService,
} from '@app/use-cases';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { getMockReq, getMockRes } from 'vitest-mock-express';
import { mock } from 'vitest-mock-extended';
import { ServiceController } from './service-controller';

describe('ServiceController', () => {
  const establishmentCode = 'est123';
  const serviceCode = 'svc123';

  const validBody = {
    name: 'Haircut',
    description: 'A haircut',
    duration: 30,
  };
  const serviceDTO = {
    id: serviceCode,
    name: 'Haircut',
    description: 'A haircut',
    duration: 30,
    establishmentCode: 'est123',
  };

  const createServiceMock = mock<CreateService>();
  const listServicesMock = mock<ListServices>();
  const findServiceMock = mock<FindService>();
  const updateServiceMock = mock<UpdateService>();
  const deleteServiceMock = mock<DeleteService>();
  const controller = new ServiceController(
    createServiceMock,
    listServicesMock,
    findServiceMock,
    updateServiceMock,
    deleteServiceMock
  );

  describe('create()', () => {
    it('returns 400 when establishmentCode is empty', async () => {
      const { res } = getMockRes();
      const req = getMockReq({ params: { establishmentCode: '' }, body: validBody });

      // @ts-expect-error
      await controller.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when name is missing', async () => {
      const { res } = getMockRes();
      const req = getMockReq({
        params: { establishmentCode },
        body: { ...validBody, name: undefined },
      });

      // @ts-expect-error
      await controller.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when duration is not provided', async () => {
      const { res } = getMockRes();
      const req = getMockReq({
        params: { establishmentCode },
        body: { ...validBody, duration: undefined },
      });

      // @ts-expect-error
      await controller.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 404 when establishment does not exist', async () => {
      createServiceMock.execute.mockResolvedValue(
        fail(new NotFoundError('Establishment', establishmentCode))
      );
      const { res } = getMockRes();
      const req = getMockReq({ params: { establishmentCode }, body: validBody });

      // @ts-expect-error
      await controller.create(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 201 with service DTO on success', async () => {
      createServiceMock.execute.mockResolvedValue(ok(serviceDTO));
      const { res } = getMockRes();
      const req = getMockReq({ params: { establishmentCode }, body: validBody });

      // @ts-expect-error
      await controller.create(req, res);

      expect(createServiceMock.execute).toHaveBeenCalledWith({
        name: validBody.name,
        description: validBody.description,
        duration: validBody.duration,
        establishmentCode,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(serviceDTO);
    });

    it('returns 500 when createService returns a storage error', async () => {
      createServiceMock.execute.mockResolvedValue(fail(new StorageError('DB error')));
      const { res } = getMockRes();
      const req = getMockReq({ params: { establishmentCode }, body: validBody });

      // @ts-expect-error
      await controller.create(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('returns 500 when createService throws', async () => {
      createServiceMock.execute.mockRejectedValue(new Error('Unexpected'));
      const { res } = getMockRes();
      const req = getMockReq({ params: { establishmentCode }, body: validBody });

      // @ts-expect-error
      await controller.create(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('list()', () => {
    it('returns 200 with list of service DTOs', async () => {
      listServicesMock.execute.mockResolvedValue(ok([serviceDTO]));
      const { res } = getMockRes();
      const req = getMockReq({ params: { establishmentCode } });

      // @ts-expect-error
      await controller.list(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([serviceDTO]);
    });

    it('returns 200 with empty array when no services', async () => {
      listServicesMock.execute.mockResolvedValue(ok([]));
      const { res } = getMockRes();
      const req = getMockReq({ params: { establishmentCode } });

      // @ts-expect-error
      await controller.list(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('returns 500 when listServices returns a storage error', async () => {
      listServicesMock.execute.mockResolvedValue(fail(new StorageError('DB error')));
      const { res } = getMockRes();
      const req = getMockReq({ params: { establishmentCode } });

      // @ts-expect-error
      await controller.list(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('returns 500 when listServices throws', async () => {
      listServicesMock.execute.mockRejectedValue(new Error('Unexpected'));
      const { res } = getMockRes();
      const req = getMockReq({ params: { establishmentCode } });

      // @ts-expect-error
      await controller.list(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('findById()', () => {
    it('returns 404 when service does not exist', async () => {
      findServiceMock.execute.mockResolvedValue(fail(new NotFoundError('Service', serviceCode)));
      const { res } = getMockRes();
      const req = getMockReq({ params: { establishmentCode, code: serviceCode } });

      // @ts-expect-error
      await controller.find(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 200 with service DTO on success', async () => {
      findServiceMock.execute.mockResolvedValue(ok(serviceDTO));
      const { res } = getMockRes();
      const req = getMockReq({ params: { establishmentCode, code: serviceCode } });

      // @ts-expect-error
      await controller.find(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(serviceDTO);
    });

    it('returns 500 when findService returns a storage error', async () => {
      findServiceMock.execute.mockResolvedValue(fail(new StorageError('DB error')));
      const { res } = getMockRes();
      const req = getMockReq({ params: { establishmentCode, code: serviceCode } });

      // @ts-expect-error
      await controller.find(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('returns 500 when findService throws', async () => {
      findServiceMock.execute.mockRejectedValue(new Error('Unexpected'));
      const { res } = getMockRes();
      const req = getMockReq({ params: { establishmentCode, code: serviceCode } });

      // @ts-expect-error
      await controller.find(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('update()', () => {
    it('returns 400 when body is invalid', async () => {
      const { res } = getMockRes();
      const req = getMockReq({
        params: { establishmentCode, code: serviceCode },
        body: { ...validBody, name: undefined },
      });

      // @ts-expect-error
      await controller.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 404 when service does not exist', async () => {
      updateServiceMock.execute.mockResolvedValue(fail(new NotFoundError('Service', serviceCode)));
      const { res } = getMockRes();
      const req = getMockReq({ params: { establishmentCode, code: serviceCode }, body: validBody });

      // @ts-expect-error
      await controller.update(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 200 with updated service DTO on success', async () => {
      updateServiceMock.execute.mockResolvedValue(ok(serviceDTO));
      const { res } = getMockRes();
      const req = getMockReq({ params: { establishmentCode, code: serviceCode }, body: validBody });

      // @ts-expect-error
      await controller.update(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(serviceDTO);
    });

    it('returns 400 when updateService returns a validation error', async () => {
      updateServiceMock.execute.mockResolvedValue(
        fail(new ValidationError('name', 'Value is required.'))
      );
      const { res } = getMockRes();
      const req = getMockReq({ params: { establishmentCode, code: serviceCode }, body: validBody });

      // @ts-expect-error
      await controller.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 500 when updateService returns a storage error', async () => {
      updateServiceMock.execute.mockResolvedValue(fail(new StorageError('DB error')));
      const { res } = getMockRes();
      const req = getMockReq({ params: { establishmentCode, code: serviceCode }, body: validBody });

      // @ts-expect-error
      await controller.update(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('returns 500 when updateService throws', async () => {
      updateServiceMock.execute.mockRejectedValue(new Error('Unexpected'));
      const { res } = getMockRes();
      const req = getMockReq({ params: { establishmentCode, code: serviceCode }, body: validBody });

      // @ts-expect-error
      await controller.update(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('delete()', () => {
    it('returns 204 on success', async () => {
      deleteServiceMock.execute.mockResolvedValue(ok(undefined));
      const { res } = getMockRes();
      const req = getMockReq({ params: { establishmentCode, code: serviceCode } });

      // @ts-expect-error
      await controller.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(204);
    });

    it('returns 404 when service does not exist', async () => {
      deleteServiceMock.execute.mockResolvedValue(fail(new NotFoundError('Service', serviceCode)));
      const { res } = getMockRes();
      const req = getMockReq({ params: { establishmentCode, code: serviceCode } });

      // @ts-expect-error
      await controller.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 409 when service has future bookings', async () => {
      deleteServiceMock.execute.mockResolvedValue(
        fail(new ConflictError('Service has future bookings.'))
      );
      const { res } = getMockRes();
      const req = getMockReq({ params: { establishmentCode, code: serviceCode } });

      // @ts-expect-error
      await controller.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('returns 500 when deleteService returns a storage error', async () => {
      deleteServiceMock.execute.mockResolvedValue(fail(new StorageError('DB error')));
      const { res } = getMockRes();
      const req = getMockReq({ params: { establishmentCode, code: serviceCode } });

      // @ts-expect-error
      await controller.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('returns 500 when deleteService throws', async () => {
      deleteServiceMock.execute.mockRejectedValue(new Error('Unexpected'));
      const { res } = getMockRes();
      const req = getMockReq({ params: { establishmentCode, code: serviceCode } });

      // @ts-expect-error
      await controller.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});

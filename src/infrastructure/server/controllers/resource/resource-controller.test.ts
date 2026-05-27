import { ConflictError, NotFoundError, StorageError, ValidationError } from '@app/domain/errors';
import type { ResourceDTO } from '@app/dtos';
import type { CreateResource, DeleteResource, ListResources, UpdateResource } from '@app/use-cases';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { getMockReq, getMockRes } from 'vitest-mock-express';
import { mock } from 'vitest-mock-extended';
import { ResourceController } from './resource-controller';

describe('ResourceController', () => {
  const establishmentCode = 'est123';
  const resourceCode = 'res123';

  const validBody = { name: 'Alice' };
  const resourceDTO: ResourceDTO = {
    id: resourceCode,
    name: 'Alice',
    establishmentCode: 'est123',
  };

  const createResourceMock = mock<CreateResource>();
  const listResourcesMock = mock<ListResources>();
  const updateResourceMock = mock<UpdateResource>();
  const deleteResourceMock = mock<DeleteResource>();
  const controller = new ResourceController(
    createResourceMock,
    listResourcesMock,
    updateResourceMock,
    deleteResourceMock
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

    it('returns 404 when establishment does not exist', async () => {
      createResourceMock.execute.mockResolvedValue(
        fail(new NotFoundError('Establishment', establishmentCode))
      );
      const { res } = getMockRes();
      const req = getMockReq({ params: { establishmentCode }, body: validBody });

      // @ts-expect-error
      await controller.create(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 201 with resource DTO on success', async () => {
      createResourceMock.execute.mockResolvedValue(ok(resourceDTO));
      const { res } = getMockRes();
      const req = getMockReq({ params: { establishmentCode }, body: validBody });

      // @ts-expect-error
      await controller.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(resourceDTO);
    });

    it('returns 400 when createResource returns a validation error', async () => {
      createResourceMock.execute.mockResolvedValue(
        fail(new ValidationError('name', 'Value is required.'))
      );
      const { res } = getMockRes();
      const req = getMockReq({ params: { establishmentCode }, body: validBody });

      // @ts-expect-error
      await controller.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 500 when createResource returns a storage error', async () => {
      createResourceMock.execute.mockResolvedValue(fail(new StorageError('DB error')));
      const { res } = getMockRes();
      const req = getMockReq({ params: { establishmentCode }, body: validBody });

      // @ts-expect-error
      await controller.create(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('returns 500 when createResource throws', async () => {
      createResourceMock.execute.mockRejectedValue(new Error('Unexpected'));
      const { res } = getMockRes();
      const req = getMockReq({ params: { establishmentCode }, body: validBody });

      // @ts-expect-error
      await controller.create(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('list()', () => {
    it('returns 404 when establishment does not exist', async () => {
      listResourcesMock.execute.mockResolvedValue(
        fail(new NotFoundError('Establishment', establishmentCode))
      );
      const { res } = getMockRes();
      const req = getMockReq({ params: { establishmentCode } });

      // @ts-expect-error
      await controller.list(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 200 with list of resource DTOs', async () => {
      listResourcesMock.execute.mockResolvedValue(ok([resourceDTO]));
      const { res } = getMockRes();
      const req = getMockReq({ params: { establishmentCode } });

      // @ts-expect-error
      await controller.list(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([resourceDTO]);
    });

    it('returns 200 with empty array when no resources', async () => {
      listResourcesMock.execute.mockResolvedValue(ok([]));
      const { res } = getMockRes();
      const req = getMockReq({ params: { establishmentCode } });

      // @ts-expect-error
      await controller.list(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('returns 500 when listResources returns a storage error', async () => {
      listResourcesMock.execute.mockResolvedValue(fail(new StorageError('DB error')));
      const { res } = getMockRes();
      const req = getMockReq({ params: { establishmentCode } });

      // @ts-expect-error
      await controller.list(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('returns 500 when listResources throws', async () => {
      listResourcesMock.execute.mockRejectedValue(new Error('Unexpected'));
      const { res } = getMockRes();
      const req = getMockReq({ params: { establishmentCode } });

      // @ts-expect-error
      await controller.list(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('update()', () => {
    const updateParams = {
      establishmentCode,
      code: resourceCode,
    };

    it('returns 400 when body is invalid', async () => {
      const { res } = getMockRes();
      const req = getMockReq({
        params: { ...updateParams, code: '' },
        body: { name: 'Room A' },
      });

      // @ts-expect-error
      await controller.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 404 when resource does not exist', async () => {
      updateResourceMock.execute.mockResolvedValue(
        fail(new NotFoundError('Resource', resourceCode))
      );
      const { res } = getMockRes();
      const req = getMockReq({ params: updateParams, body: validBody });

      // @ts-expect-error
      await controller.update(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 200 with updated resource DTO on success', async () => {
      updateResourceMock.execute.mockResolvedValue(ok(resourceDTO));
      const { res } = getMockRes();
      const req = getMockReq({ params: updateParams, body: validBody });

      // @ts-expect-error
      await controller.update(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(resourceDTO);
    });

    it('returns 400 when updateResource returns a validation error', async () => {
      updateResourceMock.execute.mockResolvedValue(
        fail(new ValidationError('name', 'Value is required.'))
      );
      const { res } = getMockRes();
      const req = getMockReq({ params: updateParams, body: validBody });

      // @ts-expect-error
      await controller.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 500 when updateResource returns a storage error', async () => {
      updateResourceMock.execute.mockResolvedValue(fail(new StorageError('DB error')));
      const { res } = getMockRes();
      const req = getMockReq({ params: updateParams, body: validBody });

      // @ts-expect-error
      await controller.update(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('returns 500 when updateResource throws', async () => {
      updateResourceMock.execute.mockRejectedValue(new Error('Unexpected'));
      const { res } = getMockRes();
      const req = getMockReq({ params: updateParams, body: validBody });

      // @ts-expect-error
      await controller.update(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('delete()', () => {
    const deleteParams = {
      establishmentCode,
      code: resourceCode,
    };

    it('returns 204 on success', async () => {
      deleteResourceMock.execute.mockResolvedValue(ok(undefined));
      const { res } = getMockRes();
      const req = getMockReq({ params: deleteParams });

      // @ts-expect-error
      await controller.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(204);
    });

    it('returns 404 when resource does not exist', async () => {
      deleteResourceMock.execute.mockResolvedValue(
        fail(new NotFoundError('Resource', resourceCode))
      );
      const { res } = getMockRes();
      const req = getMockReq({ params: deleteParams });

      // @ts-expect-error
      await controller.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 409 when resource has future bookings', async () => {
      deleteResourceMock.execute.mockResolvedValue(
        fail(new ConflictError('Resource has future bookings.'))
      );
      const { res } = getMockRes();
      const req = getMockReq({ params: deleteParams });

      // @ts-expect-error
      await controller.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('returns 500 when deleteResource returns a storage error', async () => {
      deleteResourceMock.execute.mockResolvedValue(fail(new StorageError('DB error')));
      const { res } = getMockRes();
      const req = getMockReq({ params: deleteParams });

      // @ts-expect-error
      await controller.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('returns 500 when deleteResource throws', async () => {
      deleteResourceMock.execute.mockRejectedValue(new Error('Unexpected'));
      const { res } = getMockRes();
      const req = getMockReq({ params: deleteParams });

      // @ts-expect-error
      await controller.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});

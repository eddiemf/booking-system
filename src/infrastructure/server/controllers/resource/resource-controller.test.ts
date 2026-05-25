import { ConflictError, NotFoundError, StorageError } from '@app/domain/errors';
import type { ResourceDTO } from '@app/dtos';
import type { CreateResource, DeleteResource, ListResources, UpdateResource } from '@app/use-cases';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { getMockReq, getMockRes } from 'vitest-mock-express';
import { mock } from 'vitest-mock-extended';
import { ResourceController } from './resource-controller';

describe('ResourceController', () => {
  const establishmentId = '1';
  const resourceId = '10';

  const validBody = { name: 'Alice', type: 'employee' };
  const resourceDTO: ResourceDTO = {
    id: resourceId,
    name: 'Alice',
    type: 'employee',
    establishmentId,
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
    it('returns 400 when name is missing', async () => {
      const { res } = getMockRes();
      const req = getMockReq({
        params: { establishmentId },
        body: { ...validBody, name: undefined },
      });

      // @ts-expect-error
      await controller.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when type is invalid', async () => {
      const { res } = getMockRes();
      const req = getMockReq({
        params: { establishmentId },
        body: { ...validBody, type: 'invalid' },
      });

      // @ts-expect-error
      await controller.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 404 when establishment does not exist', async () => {
      createResourceMock.execute.mockResolvedValue(
        fail(new NotFoundError('Establishment', establishmentId))
      );
      const { res } = getMockRes();
      const req = getMockReq({ params: { establishmentId }, body: validBody });

      // @ts-expect-error
      await controller.create(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 201 with resource DTO on success', async () => {
      createResourceMock.execute.mockResolvedValue(ok(resourceDTO));
      const { res } = getMockRes();
      const req = getMockReq({ params: { establishmentId }, body: validBody });

      // @ts-expect-error
      await controller.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(resourceDTO);
    });

    it('returns 500 when createResource throws', async () => {
      createResourceMock.execute.mockRejectedValue(new Error('Unexpected'));
      const { res } = getMockRes();
      const req = getMockReq({ params: { establishmentId }, body: validBody });

      // @ts-expect-error
      await controller.create(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('list()', () => {
    it('returns 404 when establishment does not exist', async () => {
      listResourcesMock.execute.mockResolvedValue(
        fail(new NotFoundError('Establishment', establishmentId))
      );
      const { res } = getMockRes();
      const req = getMockReq({ params: { establishmentId } });

      // @ts-expect-error
      await controller.list(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 200 with list of resource DTOs', async () => {
      listResourcesMock.execute.mockResolvedValue(ok([resourceDTO]));
      const { res } = getMockRes();
      const req = getMockReq({ params: { establishmentId } });

      // @ts-expect-error
      await controller.list(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([resourceDTO]);
    });

    it('returns 200 with empty array when no resources', async () => {
      listResourcesMock.execute.mockResolvedValue(ok([]));
      const { res } = getMockRes();
      const req = getMockReq({ params: { establishmentId } });

      // @ts-expect-error
      await controller.list(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('passes type filter when provided', async () => {
      listResourcesMock.execute.mockResolvedValue(ok([]));
      const { res } = getMockRes();
      const req = getMockReq({ params: { establishmentId }, query: { type: 'room' } });

      // @ts-expect-error
      await controller.list(req, res);

      expect(listResourcesMock.execute).toHaveBeenCalledWith({ establishmentId, type: 'room' });
    });

    it('ignores invalid type filter', async () => {
      listResourcesMock.execute.mockResolvedValue(ok([]));
      const { res } = getMockRes();
      const req = getMockReq({ params: { establishmentId }, query: { type: 'invalid' } });

      // @ts-expect-error
      await controller.list(req, res);

      expect(listResourcesMock.execute).toHaveBeenCalledWith({ establishmentId, type: undefined });
    });

    it('returns 500 when listResources throws', async () => {
      listResourcesMock.execute.mockRejectedValue(new Error('Unexpected'));
      const { res } = getMockRes();
      const req = getMockReq({ params: { establishmentId } });

      // @ts-expect-error
      await controller.list(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('update()', () => {
    it('returns 400 when body is invalid', async () => {
      const { res } = getMockRes();
      const req = getMockReq({ params: { id: resourceId }, body: { ...validBody, type: 'bad' } });

      // @ts-expect-error
      await controller.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 404 when resource does not exist', async () => {
      updateResourceMock.execute.mockResolvedValue(fail(new NotFoundError('Resource', resourceId)));
      const { res } = getMockRes();
      const req = getMockReq({ params: { id: resourceId }, body: validBody });

      // @ts-expect-error
      await controller.update(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 200 with updated resource DTO on success', async () => {
      updateResourceMock.execute.mockResolvedValue(ok(resourceDTO));
      const { res } = getMockRes();
      const req = getMockReq({ params: { id: resourceId }, body: validBody });

      // @ts-expect-error
      await controller.update(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(resourceDTO);
    });

    it('returns 500 when updateResource throws', async () => {
      updateResourceMock.execute.mockRejectedValue(new Error('Unexpected'));
      const { res } = getMockRes();
      const req = getMockReq({ params: { id: resourceId }, body: validBody });

      // @ts-expect-error
      await controller.update(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('delete()', () => {
    it('returns 204 on success', async () => {
      deleteResourceMock.execute.mockResolvedValue(ok(undefined));
      const { res } = getMockRes();
      const req = getMockReq({ params: { id: resourceId } });

      // @ts-expect-error
      await controller.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(204);
    });

    it('returns 404 when resource does not exist', async () => {
      deleteResourceMock.execute.mockResolvedValue(fail(new NotFoundError('Resource', resourceId)));
      const { res } = getMockRes();
      const req = getMockReq({ params: { id: resourceId } });

      // @ts-expect-error
      await controller.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 409 when resource has future bookings', async () => {
      deleteResourceMock.execute.mockResolvedValue(
        fail(new ConflictError('Resource has future bookings.'))
      );
      const { res } = getMockRes();
      const req = getMockReq({ params: { id: resourceId } });

      // @ts-expect-error
      await controller.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('returns 500 when deleteResource throws', async () => {
      deleteResourceMock.execute.mockRejectedValue(new Error('Unexpected'));
      const { res } = getMockRes();
      const req = getMockReq({ params: { id: resourceId } });

      // @ts-expect-error
      await controller.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});

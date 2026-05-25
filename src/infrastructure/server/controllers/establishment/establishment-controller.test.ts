import { ConflictError, NotFoundError, StorageError, ValidationError } from '@app/domain/errors';
import type {
  CreateEstablishment,
  DeleteEstablishment,
  FindEstablishment,
  UpdateEstablishment,
} from '@app/use-cases';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { getMockReq, getMockRes } from 'vitest-mock-express';
import { mock } from 'vitest-mock-extended';
import { EstablishmentController } from './establishment-controller';

describe('EstablishmentController', () => {
  const mockedValidInput = { name: 'My Salon' };
  const mockedEstablishmentDTO = { id: '42', name: 'My Salon' };
  const createEstablishmentMock = mock<CreateEstablishment>();
  const findEstablishmentMock = mock<FindEstablishment>();
  const updateEstablishmentMock = mock<UpdateEstablishment>();
  const deleteEstablishmentMock = mock<DeleteEstablishment>();
  const controller = new EstablishmentController(
    createEstablishmentMock,
    findEstablishmentMock,
    updateEstablishmentMock,
    deleteEstablishmentMock
  );

  describe('create()', () => {
    it('returns a validation error if a name is not provided', async () => {
      const { res } = getMockRes();
      const req = getMockReq({ body: {} });

      // @ts-expect-error
      await controller.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message:
          'Invalid value for field: name. Invalid input: expected string, received undefined',
        code: 'ValidationError',
      });
    });

    it('returns 201 with establishment DTO if params are valid', async () => {
      createEstablishmentMock.execute.mockResolvedValue(ok(mockedEstablishmentDTO));
      const { res } = getMockRes();
      const req = getMockReq({ body: mockedValidInput });

      // @ts-expect-error
      await controller.create(req, res);

      expect(createEstablishmentMock.execute).toHaveBeenCalledWith({ name: 'My Salon' });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockedEstablishmentDTO);
    });

    it('returns a validation error if createEstablishment use case returns a validation error', async () => {
      createEstablishmentMock.execute.mockResolvedValue(
        fail(new ValidationError('name', 'Value is required.'))
      );
      const { res } = getMockRes();
      const req = getMockReq({ body: mockedValidInput });

      // @ts-expect-error
      await controller.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid value for field: name. Value is required.',
        code: 'ValidationError',
      });
    });

    it('returns 500 if createEstablishment use case returns a storage error', async () => {
      createEstablishmentMock.execute.mockResolvedValue(
        fail(new StorageError('Failed to save establishment.'))
      );
      const { res } = getMockRes();
      const req = getMockReq({ body: mockedValidInput });

      // @ts-expect-error
      await controller.create(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Something went wrong. Try again later.',
        code: 'InternalServerError',
      });
    });

    it('returns 500 if createEstablishment throws an unexpected error', async () => {
      createEstablishmentMock.execute.mockRejectedValue(new Error('Unexpected'));
      const { res } = getMockRes();
      const req = getMockReq({ body: mockedValidInput });

      // @ts-expect-error
      await controller.create(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Something went wrong. Try again later.',
        code: 'InternalServerError',
      });
    });
  });

  describe('get()', () => {
    it('returns 200 with establishment DTO when found', async () => {
      findEstablishmentMock.execute.mockResolvedValue(ok(mockedEstablishmentDTO));
      const { res } = getMockRes();
      const req = getMockReq({ params: { id: '42' } });

      // @ts-expect-error
      await controller.findById(req, res);

      expect(findEstablishmentMock.execute).toHaveBeenCalledWith({ id: '42' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockedEstablishmentDTO);
    });

    it('returns 404 when establishment is not found', async () => {
      findEstablishmentMock.execute.mockResolvedValue(
        fail(new NotFoundError('Establishment', '99'))
      );
      const { res } = getMockRes();
      const req = getMockReq({ params: { id: '99' } });

      // @ts-expect-error
      await controller.findById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Establishment with id 99 was not found.',
        code: 'NotFoundError',
      });
    });

    it('returns 500 if getEstablishmentById returns a storage error', async () => {
      findEstablishmentMock.execute.mockResolvedValue(
        fail(new StorageError('Failed to find establishment.'))
      );
      const { res } = getMockRes();
      const req = getMockReq({ params: { id: '1' } });

      // @ts-expect-error
      await controller.findById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Something went wrong. Try again later.',
        code: 'InternalServerError',
      });
    });

    it('returns 500 if getEstablishmentById throws an unexpected error', async () => {
      findEstablishmentMock.execute.mockRejectedValue(new Error('Unexpected'));
      const { res } = getMockRes();
      const req = getMockReq({ params: { id: '1' } });

      // @ts-expect-error
      await controller.findById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Something went wrong. Try again later.',
        code: 'InternalServerError',
      });
    });
  });

  describe('update()', () => {
    it('returns 400 if name is not provided', async () => {
      const { res } = getMockRes();
      const req = getMockReq({ params: { id: '42' }, body: {} });

      // @ts-expect-error
      await controller.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message:
          'Invalid value for field: name. Invalid input: expected string, received undefined',
        code: 'ValidationError',
      });
    });

    it('returns 200 with updated establishment DTO on success', async () => {
      updateEstablishmentMock.execute.mockResolvedValue(ok(mockedEstablishmentDTO));
      const { res } = getMockRes();
      const req = getMockReq({ params: { id: '42' }, body: mockedValidInput });

      // @ts-expect-error
      await controller.update(req, res);

      expect(updateEstablishmentMock.execute).toHaveBeenCalledWith({ id: '42', name: 'My Salon' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockedEstablishmentDTO);
    });

    it('returns 404 when establishment is not found', async () => {
      updateEstablishmentMock.execute.mockResolvedValue(
        fail(new NotFoundError('Establishment', '42'))
      );
      const { res } = getMockRes();
      const req = getMockReq({ params: { id: '42' }, body: mockedValidInput });

      // @ts-expect-error
      await controller.update(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Establishment with id 42 was not found.',
        code: 'NotFoundError',
      });
    });

    it('returns 500 if updateEstablishment returns a storage error', async () => {
      updateEstablishmentMock.execute.mockResolvedValue(
        fail(new StorageError('Failed to update establishment.'))
      );
      const { res } = getMockRes();
      const req = getMockReq({ params: { id: '42' }, body: mockedValidInput });

      // @ts-expect-error
      await controller.update(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Something went wrong. Try again later.',
        code: 'InternalServerError',
      });
    });

    it('returns 500 if updateEstablishment throws an unexpected error', async () => {
      updateEstablishmentMock.execute.mockRejectedValue(new Error('Unexpected'));
      const { res } = getMockRes();
      const req = getMockReq({ params: { id: '42' }, body: mockedValidInput });

      // @ts-expect-error
      await controller.update(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Something went wrong. Try again later.',
        code: 'InternalServerError',
      });
    });
  });

  describe('delete()', () => {
    it('returns 204 on success', async () => {
      deleteEstablishmentMock.execute.mockResolvedValue(ok(undefined));
      const { res } = getMockRes();
      const req = getMockReq({ params: { id: '42' } });

      // @ts-expect-error
      await controller.delete(req, res);

      expect(deleteEstablishmentMock.execute).toHaveBeenCalledWith({ id: '42' });
      expect(res.status).toHaveBeenCalledWith(204);
    });

    it('returns 404 when establishment is not found', async () => {
      deleteEstablishmentMock.execute.mockResolvedValue(
        fail(new NotFoundError('Establishment', '42'))
      );
      const { res } = getMockRes();
      const req = getMockReq({ params: { id: '42' } });

      // @ts-expect-error
      await controller.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Establishment with id 42 was not found.',
        code: 'NotFoundError',
      });
    });

    it('returns 409 when establishment has associated services', async () => {
      deleteEstablishmentMock.execute.mockResolvedValue(
        fail(new ConflictError('Establishment has associated services or bookings.'))
      );
      const { res } = getMockRes();
      const req = getMockReq({ params: { id: '42' } });

      // @ts-expect-error
      await controller.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Establishment has associated services or bookings.',
        code: 'ConflictError',
      });
    });

    it('returns 500 if deleteEstablishment returns a storage error', async () => {
      deleteEstablishmentMock.execute.mockResolvedValue(
        fail(new StorageError('Failed to delete establishment.'))
      );
      const { res } = getMockRes();
      const req = getMockReq({ params: { id: '42' } });

      // @ts-expect-error
      await controller.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('returns 500 if deleteEstablishment throws an unexpected error', async () => {
      deleteEstablishmentMock.execute.mockRejectedValue(new Error('Unexpected'));
      const { res } = getMockRes();
      const req = getMockReq({ params: { id: '42' } });

      // @ts-expect-error
      await controller.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});

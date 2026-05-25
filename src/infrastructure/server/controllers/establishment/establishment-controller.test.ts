import { NotFoundError, StorageError, ValidationError } from '@app/domain/errors';
import type { CreateEstablishment, FindEstablishment } from '@app/use-cases';
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
  const controller = new EstablishmentController(createEstablishmentMock, findEstablishmentMock);

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
});

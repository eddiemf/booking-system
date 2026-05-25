import { StorageError, ValidationError } from '@app/domain/errors';
import type { CreateService } from '@app/use-cases';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { getMockReq, getMockRes } from 'vitest-mock-express';
import { mock } from 'vitest-mock-extended';
import { ServiceController } from './service-controller';

describe('ServiceController', () => {
  const mockedValidInput = {
    name: 'Service name',
    description: 'This is a test service',
    duration: 30,
  };
  const mockedServiceDTO = {
    id: 'service-id',
    name: 'Service name',
    description: 'This is a test service',
    duration: 30,
  };
  const createServiceMock = mock<CreateService>();
  const controller = new ServiceController(createServiceMock);

  it('returns a validation error if a name is not provided', async () => {
    const { res } = getMockRes();
    const req = getMockReq({
      body: { ...mockedValidInput, name: undefined },
    });

    // @ts-expect-error
    await controller.create(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid value for field: name. Invalid input: expected string, received undefined',
      code: 'ValidationError',
    });
  });

  it('returns a validation error if duration is not provided', async () => {
    const { res } = getMockRes();
    const req = getMockReq({
      body: { ...mockedValidInput, duration: undefined },
    });

    // @ts-expect-error
    await controller.create(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid value for field: duration. Invalid input: expected number, received NaN',
      code: 'ValidationError',
    });
  });

  it('returns a validation error if duration is not a number', async () => {
    const { res } = getMockRes();
    const req = getMockReq({ body: { ...mockedValidInput, duration: 'not-a-number' } });

    // @ts-expect-error
    await controller.create(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid value for field: duration. Invalid input: expected number, received NaN',
      code: 'ValidationError',
    });
  });

  it('returns a service DTO if params are valid', async () => {
    createServiceMock.execute.mockResolvedValue(ok(mockedServiceDTO));
    const { res } = getMockRes();
    const req = getMockReq({ body: mockedValidInput });

    // @ts-expect-error
    await controller.create(req, res);

    expect(createServiceMock.execute).toHaveBeenCalledWith({
      name: mockedValidInput.name,
      duration: mockedValidInput.duration,
      description: mockedValidInput.description,
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockedServiceDTO);
  });

  it('returns a validation error if createService use case returns a validation error', async () => {
    createServiceMock.execute.mockResolvedValue(
      fail(new ValidationError('some field', 'Invalid input'))
    );
    const { res } = getMockRes();
    const req = getMockReq({ body: mockedValidInput });

    // @ts-expect-error
    await controller.create(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid value for field: some field. Invalid input',
      code: 'ValidationError',
    });
  });

  it('returns a storage error if createService use case returns a storage error', async () => {
    createServiceMock.execute.mockResolvedValue(fail(new StorageError('Storage error')));
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

  it('returns an internal server error if createService throws', async () => {
    createServiceMock.execute.mockRejectedValue('anything');
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

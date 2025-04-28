import { CreateService } from '@app/use-cases';
import { getMockReq, getMockRes } from '@jest-mock/express';
import { mock } from 'jest-mock-extended';
import { ServiceController } from './service-controller';
import { StorageError, ValidationError } from '@domain/errors';

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

    await controller.createService(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Field 'name' is invalid. Expected string but received undefined.",
    });
  });

  it('returns a validation error if duration is not provided', async () => {
    const { res } = getMockRes();
    const req = getMockReq({
      body: { ...mockedValidInput, duration: undefined },
    });

    await controller.createService(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Field 'duration' is invalid. Expected number but received nan.",
    });
  });

  it('returns a validation error if duration is not a number', async () => {
    const { res } = getMockRes();
    const req = getMockReq({ body: { ...mockedValidInput, duration: 'not-a-number' } });

    await controller.createService(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Field 'duration' is invalid. Expected number but received nan.",
    });
  });

  it('returns a service DTO if params are valid', async () => {
    createServiceMock.execute.mockResolvedValue({ isOk: true, data: mockedServiceDTO });
    const { res } = getMockRes();
    const req = getMockReq({ body: mockedValidInput });

    await controller.createService(req, res);

    expect(createServiceMock.execute).toHaveBeenCalledWith(mockedValidInput);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockedServiceDTO);
  });

  it('returns a validation error if createService use case returns a validation error', async () => {
    createServiceMock.execute.mockResolvedValue({
      isOk: false,
      error: new ValidationError('some field', 'Invalid input'),
    });
    const { res } = getMockRes();
    const req = getMockReq({ body: mockedValidInput });

    await controller.createService(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid value for field: some field. Invalid input',
    });
  });

  it('returns a storage error if createService use case returns a storage error', async () => {
    createServiceMock.execute.mockResolvedValue({
      isOk: false,
      error: new StorageError('Storage error'),
    });
    const { res } = getMockRes();
    const req = getMockReq({ body: mockedValidInput });

    await controller.createService(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Storage error' });
  });

  it('returns an interval server error if createService throws', async () => {
    createServiceMock.execute.mockRejectedValue('anything');
    const { res } = getMockRes();
    const req = getMockReq({ body: mockedValidInput });

    await controller.createService(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error.' });
  });
});

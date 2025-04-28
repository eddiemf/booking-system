import { mock } from 'jest-mock-extended';
import { ServiceEntity, ServiceRepository } from '@domain/entities';
import { StorageError, ValidationError } from '@domain/errors';
import { CreateService } from './create-service';
import { getMockedServiceEntity } from '@__utils__/domain/entities';
import { ServiceMapper } from '@app/mappers';

jest.mock('@domain/entities');
jest.mock('@app/mappers');

describe('CreateService', () => {
  const serviceRepository = mock<ServiceRepository>();
  const serviceEntityMock = jest.mocked(ServiceEntity);
  const serviceMapperMock = jest.mocked(ServiceMapper);

  const useCase = new CreateService(serviceRepository);

  it('returns a validation error if creating the entity returns a validation error', async () => {
    const error = new ValidationError('name', 'Value is required.');
    serviceEntityMock.create.mockReturnValue({ isOk: false, error });

    const result = await useCase.execute({
      name: '',
      description: 'Test Service',
      duration: 60,
    });

    if (result.isOk) throw new Error('Expected an error result');

    expect(result.error).toBe(error);
    expect(serviceEntityMock.create).toHaveBeenCalledWith({
      name: '',
      description: 'Test Service',
      duration: 60,
    });
  });

  it('returns a storage error if saving the entity returns a storage error', async () => {
    const mockedEntity = getMockedServiceEntity();
    serviceEntityMock.create.mockReturnValue({ isOk: true, data: mockedEntity });
    const error = new StorageError('Failed to save the entity');
    serviceRepository.save.mockResolvedValue({ isOk: false, error });

    const result = await useCase.execute({
      name: 'Service',
      description: 'Test Service',
      duration: 60,
    });

    if (result.isOk) throw new Error('Expected an error result');

    expect(serviceRepository.save).toHaveBeenCalledWith(mockedEntity);
    expect(result.error).toBe(error);
  });

  it('returns a service DTO when creation was successful', async () => {
    const mockedEntity = getMockedServiceEntity();
    serviceEntityMock.create.mockReturnValue({ isOk: true, data: mockedEntity });
    serviceRepository.save.mockResolvedValue({ isOk: true, data: undefined });
    serviceMapperMock.toDTO.mockReturnValue({
      id: '123',
      name: 'Service',
      description: 'Test Service',
      duration: 60,
    });

    const result = await useCase.execute({
      name: 'Service',
      description: 'Test Service',
      duration: 60,
    });

    if (!result.isOk) throw new Error('Expected a success result');

    expect(result.data).toEqual({
      id: '123',
      name: 'Service',
      description: 'Test Service',
      duration: 60,
    });
    expect(serviceMapperMock.toDTO).toHaveBeenCalledWith(mockedEntity);
  });
});

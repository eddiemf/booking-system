import { Ok, PromiseResult } from '@shared/result';
import { TYPES } from '@shared/ioc-types';
import { ServiceCreationError, ServiceEntity, ServiceRepository } from '@domain/entities';
import { StorageError } from '@domain/errors';
import { ServiceMapper } from '../../../mappers';
import { ServiceDTO } from '../../../dtos';
import { inject, injectable } from 'inversify';

type Input = {
  name: string;
  description?: string;
  duration: number;
};

@injectable()
export class CreateService {
  constructor(
    @inject(TYPES.ServiceRepository) private readonly serviceRepository: ServiceRepository
  ) {}

  async execute({
    name,
    description,
    duration,
  }: Input): PromiseResult<ServiceDTO, ServiceCreationError | StorageError> {
    const serviceResult = ServiceEntity.create({ name, description, duration });
    if (!serviceResult.isOk) return serviceResult;

    const entity = serviceResult.data;

    const saveResult = await this.serviceRepository.save(entity);
    if (!saveResult.isOk) return saveResult;

    return Ok(ServiceMapper.toDTO(entity));
  }
}

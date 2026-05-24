import { type ServiceCreationError, ServiceEntity, type ServiceRepository } from '@domain/entities';
import type { StorageError } from '@domain/errors';
import { TYPES } from '@shared/ioc-types';
import { Ok, type PromiseResult } from '@shared/result';
import { inject, injectable } from 'inversify';
import type { ServiceDTO } from '../../../dtos';
import { ServiceMapper } from '../../../mappers';

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

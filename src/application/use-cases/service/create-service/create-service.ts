import {
  type ServiceCreationError,
  ServiceEntity,
  type ServiceRepository,
} from '@app/domain/entities';
import type { NotFoundError, StorageError } from '@app/domain/errors';
import { ok, type PromiseResult } from '@shared/result';
import type { ServiceDTO } from '../../../dtos';
import { ServiceMapper } from '../../../mappers';

type Input = {
  name: string;
  description?: string | undefined;
  duration: number;
  establishmentId: string;
};

export class CreateService {
  constructor(private readonly serviceRepository: ServiceRepository) {}

  async execute({
    name,
    description,
    duration,
    establishmentId,
  }: Input): PromiseResult<ServiceDTO, ServiceCreationError | StorageError | NotFoundError> {
    const serviceResult = ServiceEntity.create({ name, description, duration, establishmentId });
    if (!serviceResult.isOk) return serviceResult;

    const entity = serviceResult.data;

    const saveResult = await this.serviceRepository.save(entity);
    if (!saveResult.isOk) return saveResult;

    return ok(ServiceMapper.toDTO(saveResult.data));
  }
}

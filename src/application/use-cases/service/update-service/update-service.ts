import { ServiceEntity, type ServiceRepository } from '@app/domain/entities';
import type { NotFoundError, StorageError, ValidationError } from '@app/domain/errors';
import { ok, type PromiseResult } from '@shared/result';
import type { ServiceDTO } from '../../../dtos';
import { ServiceMapper } from '../../../mappers';

type Input = {
  id: string;
  establishmentId: string;
  name: string;
  description?: string | undefined;
  duration: number;
};

export class UpdateService {
  constructor(private readonly serviceRepository: ServiceRepository) {}

  async execute({
    id,
    establishmentId,
    name,
    description,
    duration,
  }: Input): PromiseResult<ServiceDTO, StorageError | NotFoundError | ValidationError> {
    const entityResult = ServiceEntity.create({ name, description, duration, establishmentId });
    if (!entityResult.isOk) return entityResult;

    const updateResult = await this.serviceRepository.update(
      id,
      establishmentId,
      entityResult.data
    );
    if (!updateResult.isOk) return updateResult;

    return ok(ServiceMapper.toDTO(updateResult.data));
  }
}

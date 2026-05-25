import type { ServiceRepository } from '@app/domain/entities';
import { NotFoundError, type StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';
import type { ServiceDTO } from '../../../dtos';
import { ServiceMapper } from '../../../mappers';

type Input = { id: string; establishmentId: string };

export class FindService {
  constructor(private readonly serviceRepository: ServiceRepository) {}

  async execute({
    id,
    establishmentId,
  }: Input): PromiseResult<ServiceDTO, StorageError | NotFoundError> {
    const result = await this.serviceRepository.findById(id, establishmentId);
    if (!result.isOk) return result;
    if (!result.data) return fail(new NotFoundError('Service', id));

    return ok(ServiceMapper.toDTO(result.data));
  }
}

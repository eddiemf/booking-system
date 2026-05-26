import type { ServiceRepository } from '@app/domain/entities';
import { NotFoundError, type StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';
import type { ServiceDTO } from '../../../dtos';
import { ServiceMapper } from '../../../mappers';

type Input = { code: string; establishmentCode: string };

export class FindService {
  constructor(private readonly serviceRepository: ServiceRepository) {}

  async execute({
    code,
    establishmentCode,
  }: Input): PromiseResult<ServiceDTO, StorageError | NotFoundError> {
    const result = await this.serviceRepository.findByCode(code, establishmentCode);
    if (!result.isOk) return result;
    if (!result.data) return fail(new NotFoundError('Service', code));

    return ok(ServiceMapper.toDTO(result.data));
  }
}

import type { ServiceRepository } from '@app/domain/entities';
import type { StorageError } from '@app/domain/errors';
import { ok, type PromiseResult } from '@shared/result';
import type { ServiceDTO } from '../../../dtos';
import { ServiceMapper } from '../../../mappers';

type Input = { establishmentCode: string };

export class ListServices {
  constructor(private readonly serviceRepository: ServiceRepository) {}

  async execute({ establishmentCode }: Input): PromiseResult<ServiceDTO[], StorageError> {
    const result = await this.serviceRepository.get(establishmentCode);
    if (!result.isOk) return result;

    return ok(result.data.map(ServiceMapper.toDTO));
  }
}

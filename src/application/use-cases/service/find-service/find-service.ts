import type { NotFoundError, StorageError } from '@app/domain/errors';
import type { ServiceLoader } from '@app/loaders';
import { ok, type PromiseResult } from '@shared/result';
import type { ServiceDTO } from '../../../dtos';
import { ServiceMapper } from '../../../mappers';

type Input = { code: string; establishmentCode: string };

export class FindService {
  constructor(private readonly serviceLoader: ServiceLoader) {}

  async execute({
    code,
    establishmentCode,
  }: Input): PromiseResult<ServiceDTO, StorageError | NotFoundError> {
    const result = await this.serviceLoader.load(code, establishmentCode);
    if (!result.isOk) return result;

    return ok(ServiceMapper.toDTO(result.data));
  }
}

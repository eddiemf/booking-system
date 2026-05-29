import type { NotFoundError, StorageError } from '@app/domain/errors';
import type { EstablishmentLoader } from '@app/loaders';
import { ok, type PromiseResult } from '@shared/result';
import type { EstablishmentDTO } from '../../../dtos';
import { EstablishmentMapper } from '../../../mappers';

interface Input {
  code: string;
}

export class FindEstablishment {
  constructor(private readonly establishmentLoader: EstablishmentLoader) {}

  async execute({ code }: Input): PromiseResult<EstablishmentDTO, NotFoundError | StorageError> {
    const result = await this.establishmentLoader.load(code);
    if (!result.isOk) return result;

    const establishment = result.data;

    return ok(EstablishmentMapper.toDTO(establishment));
  }
}

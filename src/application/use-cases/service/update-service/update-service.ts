import type { ServiceRepository } from '@app/domain/entities';
import { NotFoundError, type StorageError, type ValidationError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';
import type { ServiceDTO } from '../../../dtos';
import { ServiceMapper } from '../../../mappers';

type Input = {
  code: string;
  establishmentCode: string;
  name: string;
  description?: string | undefined;
  duration: number;
};

export class UpdateService {
  constructor(private readonly serviceRepository: ServiceRepository) {}

  async execute({
    code,
    establishmentCode,
    name,
    description,
    duration,
  }: Input): PromiseResult<ServiceDTO, StorageError | NotFoundError | ValidationError> {
    const serviceResult = await this.serviceRepository.findByCode(code, establishmentCode);
    if (!serviceResult.isOk) return serviceResult;
    if (!serviceResult.data) return fail(new NotFoundError('Service', code));

    const service = serviceResult.data;
    const updateValidation = service.update({ name, description, duration });
    if (!updateValidation.isOk) return updateValidation;

    const updateResult = await this.serviceRepository.update(code, establishmentCode, service);
    if (!updateResult.isOk) return updateResult;

    return ok(ServiceMapper.toDTO(updateResult.data));
  }
}

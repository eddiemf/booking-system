import { ServiceEntity, type ServiceRepository } from '@app/domain/entities';
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

    const editedServiceResult = ServiceEntity.create({
      name,
      description,
      duration,
      establishmentId: serviceResult.data.establishmentId,
    });
    if (!editedServiceResult.isOk) return editedServiceResult;

    const editedService = editedServiceResult.data;
    const updateResult = await this.serviceRepository.update(
      code,
      establishmentCode,
      editedService
    );
    if (!updateResult.isOk) return updateResult;

    return ok(ServiceMapper.toDTO(updateResult.data));
  }
}

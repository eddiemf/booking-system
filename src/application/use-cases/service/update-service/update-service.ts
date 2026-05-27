import type { EstablishmentRepository, ServiceRepository } from '@app/domain/entities';
import {
  ForbiddenError,
  NotFoundError,
  type StorageError,
  type ValidationError,
} from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';
import type { ServiceDTO } from '../../../dtos';
import { ServiceMapper } from '../../../mappers';

type Input = {
  code: string;
  establishmentCode: string;
  name: string;
  description?: string | undefined;
  duration: number;
  userId: string;
};

export class UpdateService {
  constructor(
    private readonly serviceRepository: ServiceRepository,
    private readonly establishmentRepository: EstablishmentRepository
  ) {}

  async execute({
    code,
    establishmentCode,
    name,
    description,
    duration,
    userId,
  }: Input): PromiseResult<
    ServiceDTO,
    StorageError | NotFoundError | ValidationError | ForbiddenError
  > {
    const establishmentResult = await this.establishmentRepository.findByCode(establishmentCode);
    if (!establishmentResult.isOk) return establishmentResult;
    if (!establishmentResult.data)
      return fail(new NotFoundError('Establishment', establishmentCode));
    if (establishmentResult.data.userId !== userId) {
      return fail(new ForbiddenError('You do not own this establishment.'));
    }

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

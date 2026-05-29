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
    const [establishmentResult, serviceResult] = await Promise.all([
      this.establishmentRepository.findByCode(establishmentCode),
      this.serviceRepository.findByCode(code, establishmentCode),
    ]);

    if (!establishmentResult.isOk) return establishmentResult;
    if (!serviceResult.isOk) return serviceResult;

    const establishment = establishmentResult.data;
    if (!establishment) return fail(new NotFoundError('Establishment', establishmentCode));

    const service = serviceResult.data;
    if (!service) return fail(new NotFoundError('Service', code));

    if (establishment.userId !== userId) {
      return fail(new ForbiddenError('You do not own this establishment.'));
    }

    const updateValidation = service.update({ name, description, duration });
    if (!updateValidation.isOk) return updateValidation;

    const updateResult = await this.serviceRepository.update(code, establishmentCode, service);
    if (!updateResult.isOk) return updateResult;

    const updatedService = updateResult.data;

    return ok(ServiceMapper.toDTO(updatedService));
  }
}

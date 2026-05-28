import {
  type EstablishmentRepository,
  Service,
  type ServiceRepository,
  type ServiceValidationError,
} from '@app/domain/entities';
import { ForbiddenError, NotFoundError, type StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';
import type { ServiceDTO } from '../../../dtos';
import { ServiceMapper } from '../../../mappers';

type Input = {
  name: string;
  description?: string | undefined;
  duration: number;
  establishmentCode: string;
  userId: string;
};

export class CreateService {
  constructor(
    private readonly establishmentRepository: EstablishmentRepository,
    private readonly serviceRepository: ServiceRepository
  ) {}

  async execute({
    name,
    description,
    duration,
    establishmentCode,
    userId,
  }: Input): PromiseResult<
    ServiceDTO,
    ServiceValidationError | StorageError | NotFoundError | ForbiddenError
  > {
    const establishmentResult = await this.establishmentRepository.findByCode(establishmentCode);
    if (!establishmentResult.isOk) return establishmentResult;
    if (!establishmentResult.data)
      return fail(new NotFoundError('Establishment', establishmentCode));
    if (establishmentResult.data.userId !== userId) {
      return fail(new ForbiddenError('You do not own this establishment.'));
    }

    const establishmentId = establishmentResult.data.id;
    const serviceResult = Service.create({
      name,
      description,
      duration,
      establishmentId,
      establishmentCode,
    });
    if (!serviceResult.isOk) return serviceResult;

    const service = serviceResult.data;
    const saveResult = await this.serviceRepository.save(service);
    if (!saveResult.isOk) return saveResult;

    return ok(ServiceMapper.toDTO(saveResult.data));
  }
}

import {
  type EstablishmentRepository,
  type ServiceCreationError,
  ServiceEntity,
  type ServiceRepository,
} from '@app/domain/entities';
import { NotFoundError, type StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';
import type { ServiceDTO } from '../../../dtos';
import { ServiceMapper } from '../../../mappers';

type Input = {
  name: string;
  description?: string | undefined;
  duration: number;
  establishmentCode: string;
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
  }: Input): PromiseResult<ServiceDTO, ServiceCreationError | StorageError | NotFoundError> {
    const establishmentResult = await this.establishmentRepository.findByCode(establishmentCode);
    if (!establishmentResult.isOk) return establishmentResult;
    if (!establishmentResult.data)
      return fail(new NotFoundError('Establishment', establishmentCode));

    const serviceResult = ServiceEntity.create({
      name,
      description,
      duration,
      establishmentId: establishmentResult.data.id,
    });
    if (!serviceResult.isOk) return serviceResult;

    const saveResult = await this.serviceRepository.save(serviceResult.data);
    if (!saveResult.isOk) return saveResult;

    return ok(ServiceMapper.toDTO(saveResult.data));
  }
}

import type { EstablishmentRepository, ServiceRepository } from '@app/domain/entities';
import { NotFoundError, type StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';
import type { ServiceDTO } from '../../../dtos';
import { ServiceMapper } from '../../../mappers';

type Input = { establishmentId: string };

export class ListServices {
  constructor(
    private readonly establishmentRepository: EstablishmentRepository,
    private readonly serviceRepository: ServiceRepository
  ) {}

  async execute({
    establishmentId,
  }: Input): PromiseResult<ServiceDTO[], StorageError | NotFoundError> {
    const establishmentResult = await this.establishmentRepository.findById(establishmentId);
    if (!establishmentResult.isOk) return establishmentResult;
    if (!establishmentResult.data) return fail(new NotFoundError('Establishment', establishmentId));

    const servicesResult = await this.serviceRepository.findAll(establishmentId);
    if (!servicesResult.isOk) return servicesResult;

    return ok(servicesResult.data.map(ServiceMapper.toDTO));
  }
}

import type { EstablishmentRepository, ServiceRepository } from '@app/domain/entities';
import { NotFoundError, type StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';
import type { ServiceDTO } from '../../../dtos';
import { ServiceMapper } from '../../../mappers';

type Input = { establishmentCode: string };

export class ListServices {
  constructor(
    private readonly establishmentRepository: EstablishmentRepository,
    private readonly serviceRepository: ServiceRepository
  ) {}

  async execute({
    establishmentCode,
  }: Input): PromiseResult<ServiceDTO[], StorageError | NotFoundError> {
    const establishmentResult = await this.establishmentRepository.findByCode(establishmentCode);
    if (!establishmentResult.isOk) return establishmentResult;
    if (!establishmentResult.data)
      return fail(new NotFoundError('Establishment', establishmentCode));

    const servicesResult = await this.serviceRepository.findAll(establishmentCode);
    if (!servicesResult.isOk) return servicesResult;

    return ok(servicesResult.data.map(ServiceMapper.toDTO));
  }
}

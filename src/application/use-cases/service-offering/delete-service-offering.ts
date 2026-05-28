import type {
  EstablishmentRepository,
  ResourceRepository,
  ServiceOfferingRepository,
  ServiceRepository,
} from '@app/domain/entities';
import { ForbiddenError, NotFoundError, type StorageError } from '@app/domain/errors';
import { fail, type PromiseResult } from '@shared/result';

type Input = {
  serviceCode: string;
  resourceCode: string;
  establishmentCode: string;
  userId: string;
};

export class DeleteServiceOffering {
  constructor(
    private readonly serviceOfferingRepository: ServiceOfferingRepository,
    private readonly serviceRepository: ServiceRepository,
    private readonly resourceRepository: ResourceRepository,
    private readonly establishmentRepository: EstablishmentRepository
  ) {}

  async execute({
    serviceCode,
    resourceCode,
    establishmentCode,
    userId,
  }: Input): PromiseResult<void, StorageError | NotFoundError | ForbiddenError> {
    const establishmentResult = await this.establishmentRepository.findByCode(establishmentCode);
    if (!establishmentResult.isOk) return establishmentResult;
    if (!establishmentResult.data)
      return fail(new NotFoundError('Establishment', establishmentCode));
    if (establishmentResult.data.userId !== userId) {
      return fail(new ForbiddenError('You do not own this establishment.'));
    }

    const serviceResult = await this.serviceRepository.findByCode(serviceCode, establishmentCode);
    if (!serviceResult.isOk) return serviceResult;
    if (!serviceResult.data) return fail(new NotFoundError('Service', serviceCode));

    const resourceResult = await this.resourceRepository.findByCode(resourceCode);
    if (!resourceResult.isOk) return resourceResult;
    if (!resourceResult.data) return fail(new NotFoundError('Resource', resourceCode));

    return this.serviceOfferingRepository.unassign(serviceResult.data.id, resourceResult.data.id);
  }
}

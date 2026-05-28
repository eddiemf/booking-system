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
    const [establishmentResult, serviceResult, resourceResult] = await Promise.all([
      this.establishmentRepository.findByCode(establishmentCode),
      this.serviceRepository.findByCode(serviceCode, establishmentCode),
      this.resourceRepository.findByCode(resourceCode),
    ]);

    if (!establishmentResult.isOk) return establishmentResult;
    if (!serviceResult.isOk) return serviceResult;
    if (!resourceResult.isOk) return resourceResult;

    const establishment = establishmentResult.data;
    if (!establishment) return fail(new NotFoundError('Establishment', establishmentCode));
    if (establishment.userId !== userId) {
      return fail(new ForbiddenError('You do not own this establishment.'));
    }

    const service = serviceResult.data;
    if (!service) return fail(new NotFoundError('Service', serviceCode));

    const resource = resourceResult.data;
    if (!resource) return fail(new NotFoundError('Resource', resourceCode));

    return this.serviceOfferingRepository.unassign(service.id, resource.id);
  }
}

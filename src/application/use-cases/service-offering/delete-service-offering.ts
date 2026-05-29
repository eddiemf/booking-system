import type {
  ResourceRepository,
  ServiceOfferingRepository,
  ServiceRepository,
} from '@app/domain/entities';
import { type ForbiddenError, NotFoundError, type StorageError } from '@app/domain/errors';
import type { EstablishmentLoader } from '@app/loaders';
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
    private readonly establishmentLoader: EstablishmentLoader
  ) {}

  async execute({
    serviceCode,
    resourceCode,
    establishmentCode,
    userId,
  }: Input): PromiseResult<void, StorageError | NotFoundError | ForbiddenError> {
    const establishmentResult = await this.establishmentLoader.loadOwnedByUser(
      establishmentCode,
      userId
    );
    if (!establishmentResult.isOk) return establishmentResult;

    const [serviceResult, resourceResult] = await Promise.all([
      this.serviceRepository.findByCode(serviceCode, establishmentCode),
      this.resourceRepository.findByCode(resourceCode),
    ]);

    if (!serviceResult.isOk) return serviceResult;
    if (!resourceResult.isOk) return resourceResult;

    const service = serviceResult.data;
    if (!service) return fail(new NotFoundError('Service', serviceCode));

    const resource = resourceResult.data;
    if (!resource) return fail(new NotFoundError('Resource', resourceCode));

    return this.serviceOfferingRepository.unassign(service.id, resource.id);
  }
}

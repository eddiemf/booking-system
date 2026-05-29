import type {
  ResourceRepository,
  ServiceOfferingRepository,
  ServiceRepository,
} from '@app/domain/entities';
import type { ForbiddenError, NotFoundError, StorageError } from '@app/domain/errors';
import type { EstablishmentLoader, ResourceLoader, ServiceLoader } from '@app/loaders';
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
    private readonly serviceLoader: ServiceLoader,
    private readonly resourceLoader: ResourceLoader,
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
      this.serviceLoader.load(serviceCode, establishmentCode),
      this.resourceLoader.load(resourceCode, establishmentCode),
    ]);
    if (!serviceResult.isOk) return serviceResult;
    if (!resourceResult.isOk) return resourceResult;

    const service = serviceResult.data;
    const resource = resourceResult.data;

    return this.serviceOfferingRepository.unassign(service.id, resource.id);
  }
}

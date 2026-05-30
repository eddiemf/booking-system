import { ServiceOffering, type ServiceOfferingRepository } from '@app/domain/entities';
import { ConflictError, NotFoundError, StorageError } from '@app/domain/errors';
import type { PrismaClient } from '@prisma/client';
import { fail, ok, type PromiseResult } from '@shared/result';
import { isUniqueViolation } from '../../db/errors';

export class PostgressServiceOfferingRepository implements ServiceOfferingRepository {
  constructor(private readonly db: PrismaClient) {}

  async assign(
    serviceOffering: ServiceOffering
  ): PromiseResult<ServiceOffering, StorageError | NotFoundError | ConflictError> {
    try {
      await this.db.serviceOffering.create({
        data: {
          id: serviceOffering.id,
          code: serviceOffering.code,
          serviceId: serviceOffering.serviceId,
          resourceId: serviceOffering.resourceId,
          maxCapacity: serviceOffering.maxCapacity.value,
          durationMinutes: serviceOffering.duration.toMinutes(),
          slotIntervalMinutes: serviceOffering.slotInterval.toMinutes(),
          price: serviceOffering.price.value,
        },
      });
      return ok(serviceOffering);
    } catch (error) {
      if (isUniqueViolation(error)) {
        return fail(new ConflictError('Resource is already assigned to this service.'));
      }
      return fail(new StorageError('Failed to assign resource to service.'));
    }
  }

  async unassign(
    serviceId: string,
    resourceId: string
  ): PromiseResult<void, StorageError | NotFoundError> {
    try {
      const result = await this.db.serviceOffering.deleteMany({
        where: { serviceId, resourceId },
      });

      if (result.count === 0) {
        return fail(new NotFoundError('ServiceOffering', `${serviceId}:${resourceId}`));
      }
      return ok(undefined);
    } catch {
      return fail(new StorageError('Failed to unassign resource from service.'));
    }
  }

  async getByServiceCode(
    serviceCode: string,
    establishmentCode: string
  ): PromiseResult<ServiceOffering[], StorageError> {
    try {
      const service = await this.db.service.findFirst({
        where: { code: serviceCode, establishment: { code: establishmentCode } },
        include: { serviceOfferings: true },
      });

      if (!service) return ok([]);

      return ok(
        service.serviceOfferings.map((row) =>
          ServiceOffering.reconstruct({
            id: row.id,
            code: row.code,
            serviceId: row.serviceId,
            resourceId: row.resourceId,
            maxCapacity: row.maxCapacity,
            durationMinutes: row.durationMinutes,
            slotIntervalMinutes: row.slotIntervalMinutes,
            price: row.price,
          })
        )
      );
    } catch {
      return fail(new StorageError('Failed to find service-resource links.'));
    }
  }

  async getByResourceCode(
    resourceCode: string,
    establishmentCode: string
  ): PromiseResult<ServiceOffering[], StorageError> {
    try {
      const resource = await this.db.resource.findFirst({
        where: { code: resourceCode, establishment: { code: establishmentCode } },
        include: { serviceOfferings: true },
      });

      if (!resource) return ok([]);

      return ok(
        resource.serviceOfferings.map((row) =>
          ServiceOffering.reconstruct({
            id: row.id,
            code: row.code,
            serviceId: row.serviceId,
            resourceId: row.resourceId,
            maxCapacity: row.maxCapacity,
            durationMinutes: row.durationMinutes,
            slotIntervalMinutes: row.slotIntervalMinutes,
            price: row.price,
          })
        )
      );
    } catch {
      return fail(new StorageError('Failed to find resource-service links.'));
    }
  }
}

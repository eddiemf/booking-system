import { ServiceOfferingEntity, type ServiceOfferingRepository } from '@app/domain/entities';
import { ConflictError, NotFoundError, StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';
import { and, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { isUniqueViolation } from '../../db/errors';
import {
  establishmentsTable,
  resourcesTable,
  serviceOfferingsTable,
  servicesTable,
} from '../../db/schema';

export class PostgressServiceOfferingRepository implements ServiceOfferingRepository {
  constructor(private readonly db: NodePgDatabase) {}

  async assign(
    serviceOffering: ServiceOfferingEntity
  ): PromiseResult<ServiceOfferingEntity, StorageError | NotFoundError | ConflictError> {
    try {
      await this.db.insert(serviceOfferingsTable).values({
        id: serviceOffering.id,
        code: serviceOffering.code,
        serviceId: serviceOffering.serviceId,
        resourceId: serviceOffering.resourceId,
        maxCapacity: serviceOffering.maxCapacity.value,
        durationMinutes: serviceOffering.durationMinutes.toMinutes(),
        slotIntervalMinutes: serviceOffering.slotIntervalMinutes.toMinutes(),
        price: serviceOffering.price.value,
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
      const rows = await this.db
        .delete(serviceOfferingsTable)
        .where(
          and(
            eq(serviceOfferingsTable.serviceId, serviceId),
            eq(serviceOfferingsTable.resourceId, resourceId)
          )
        )
        .returning({ id: serviceOfferingsTable.id });
      if (!rows[0]) return fail(new NotFoundError('ServiceOffering', `${serviceId}:${resourceId}`));
      return ok(undefined);
    } catch (error) {
      return fail(new StorageError('Failed to unassign resource from service.'));
    }
  }

  async findByServiceCode(
    serviceCode: string,
    establishmentCode: string
  ): PromiseResult<ServiceOfferingEntity[], StorageError> {
    try {
      const rows = await this.db
        .select({
          id: serviceOfferingsTable.id,
          code: serviceOfferingsTable.code,
          serviceId: serviceOfferingsTable.serviceId,
          resourceId: serviceOfferingsTable.resourceId,
          maxCapacity: serviceOfferingsTable.maxCapacity,
          durationMinutes: serviceOfferingsTable.durationMinutes,
          slotIntervalMinutes: serviceOfferingsTable.slotIntervalMinutes,
          price: serviceOfferingsTable.price,
        })
        .from(serviceOfferingsTable)
        .innerJoin(servicesTable, eq(serviceOfferingsTable.serviceId, servicesTable.id))
        .innerJoin(establishmentsTable, eq(servicesTable.establishmentId, establishmentsTable.id))
        .where(
          and(eq(servicesTable.code, serviceCode), eq(establishmentsTable.code, establishmentCode))
        );

      return ok(
        rows.map((row) =>
          ServiceOfferingEntity.reconstruct({
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
    } catch (error) {
      return fail(new StorageError('Failed to find service-resource links.'));
    }
  }

  async findByResourceCode(
    resourceCode: string,
    establishmentCode: string
  ): PromiseResult<ServiceOfferingEntity[], StorageError> {
    try {
      const rows = await this.db
        .select({
          id: serviceOfferingsTable.id,
          code: serviceOfferingsTable.code,
          serviceId: serviceOfferingsTable.serviceId,
          resourceId: serviceOfferingsTable.resourceId,
          maxCapacity: serviceOfferingsTable.maxCapacity,
          durationMinutes: serviceOfferingsTable.durationMinutes,
          slotIntervalMinutes: serviceOfferingsTable.slotIntervalMinutes,
          price: serviceOfferingsTable.price,
        })
        .from(serviceOfferingsTable)
        .innerJoin(resourcesTable, eq(serviceOfferingsTable.resourceId, resourcesTable.id))
        .innerJoin(establishmentsTable, eq(resourcesTable.establishmentId, establishmentsTable.id))
        .where(
          and(
            eq(resourcesTable.code, resourceCode),
            eq(establishmentsTable.code, establishmentCode)
          )
        );

      return ok(
        rows.map((row) =>
          ServiceOfferingEntity.reconstruct({
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
    } catch (error) {
      return fail(new StorageError('Failed to find resource-service links.'));
    }
  }
}

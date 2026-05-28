import type { ResourceEntity, ServiceOfferingEntity } from '@app/domain/entities';
import type { ServiceOfferingDTO } from '@app/dtos';

export class ServiceOfferingMapper {
  static toDTO(
    serviceOffering: ServiceOfferingEntity,
    serviceCode: string,
    resource: ResourceEntity
  ): ServiceOfferingDTO {
    return {
      id: serviceOffering.code,
      serviceCode,
      resourceCode: resource.code,
      resourceName: resource.name,
      maxCapacity: serviceOffering.maxCapacity.value,
      durationMinutes: serviceOffering.durationMinutes.toMinutes(),
      slotIntervalMinutes: serviceOffering.slotIntervalMinutes.toMinutes(),
      price: serviceOffering.price.value,
    };
  }
}

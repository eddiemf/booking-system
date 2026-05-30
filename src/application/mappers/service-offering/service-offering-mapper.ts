import type { Resource, ServiceOffering } from '@app/domain/entities';
import type { ServiceOfferingDTO } from '@app/dtos';

export class ServiceOfferingMapper {
  static toDTO(
    serviceOffering: ServiceOffering,
    serviceCode: string,
    resource: Resource
  ): ServiceOfferingDTO {
    return {
      id: serviceOffering.code,
      serviceCode,
      resourceCode: resource.code,
      resourceName: resource.name,
      maxCapacity: serviceOffering.maxCapacity.value,
      duration: serviceOffering.duration.toMinutes(),
      slotInterval: serviceOffering.slotInterval.toMinutes(),
      price: serviceOffering.price.value,
    };
  }
}

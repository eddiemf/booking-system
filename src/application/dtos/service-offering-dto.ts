export interface ServiceOfferingDTO {
  id: string;
  serviceCode: string;
  resourceCode: string;
  resourceName: string;
  maxCapacity: number;
  durationMinutes: number;
  slotIntervalMinutes: number;
}

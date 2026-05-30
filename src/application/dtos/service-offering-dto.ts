export interface ServiceOfferingDTO {
  id: string;
  serviceCode: string;
  resourceCode: string;
  resourceName: string;
  maxCapacity: number;
  duration: number;
  slotInterval: number;
  price: number;
}

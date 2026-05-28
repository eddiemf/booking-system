export interface BookingDTO {
  id: string;
  customerCode: string;
  customerName: string;
  serviceCode: string;
  serviceName: string;
  resourceCode: string;
  resourceName: string;
  establishmentCode: string;
  startsAt: string;
  endsAt: string;
  status: 'confirmed' | 'cancelled';
}

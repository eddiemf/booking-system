import type { Booking } from '@app/domain/entities';
import type { BookingDTO } from '@app/dtos';

export class BookingMapper {
  static toDTO(booking: Booking): BookingDTO {
    return {
      id: booking.code,
      customerCode: booking.customerCode,
      customerName: booking.customerName,
      serviceCode: booking.serviceCode,
      serviceName: booking.serviceName,
      resourceCode: booking.resourceCode,
      resourceName: booking.resourceName,
      establishmentCode: booking.establishmentCode,
      startsAt: booking.startsAt,
      endsAt: booking.endsAt,
      status: booking.status,
      servicePrice: booking.servicePrice,
      serviceDuration: booking.serviceDuration,
    };
  }
}

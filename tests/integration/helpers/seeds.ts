import type {
  BookingRepository,
  EstablishmentRepository,
  ResourceRepository,
  ServiceRepository,
} from '@app/domain/entities';
import {
  Booking,
  Establishment,
  Resource,
  Schedule,
  Service,
  ServiceOffering,
} from '@app/domain/entities';
import type { ScheduleRepository } from '@app/domain/entities/schedule';
import type { AwilixContainer } from 'awilix';
import type { InMemoryServiceOfferingRepository } from '../repositories/in-memory-service-offering-repository';

/**
 * Create an establishment directly via the repository (bypasses API for seed data).
 */
export async function seedEstablishment(
  container: AwilixContainer,
  name: string,
  userId: string,
  timezone = 'UTC'
): Promise<Establishment> {
  const estRepo = container.resolve('establishmentRepository') as EstablishmentRepository;
  const estResult = Establishment.create({ name, userId, timezone });
  if (!estResult.isOk) throw new Error('Failed to create establishment');
  const est = estResult.data;
  await estRepo.save(est);
  return est;
}

/**
 * Create a resource directly via the repository.
 */
export async function seedResource(
  container: AwilixContainer,
  name: string,
  establishmentId: string,
  establishmentCode: string
): Promise<Resource> {
  const resRepo = container.resolve('resourceRepository') as ResourceRepository;
  const resResult = Resource.create({ name, establishmentId, establishmentCode });
  if (!resResult.isOk) throw new Error('Failed to create resource');
  const res = resResult.data;
  await resRepo.save(res);
  return res;
}

/**
 * Create a service directly via the repository.
 */
export async function seedService(
  container: AwilixContainer,
  name: string,
  duration: number,
  establishmentId: string,
  establishmentCode: string,
  description = ''
): Promise<Service> {
  const svcRepo = container.resolve('serviceRepository') as ServiceRepository;
  const svcResult = Service.create({
    name,
    description,
    duration,
    establishmentId,
    establishmentCode,
  });
  if (!svcResult.isOk) throw new Error('Failed to create service');
  const svc = svcResult.data;
  await svcRepo.save(svc);
  return svc;
}

interface SeedScheduleEntry {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

/**
 * Create schedule entries directly via the repository.
 * Accepts one or more entries for the same resource.
 * Replaces any existing schedules for this resource.
 */
export async function seedSchedule(
  container: AwilixContainer,
  resourceId: string,
  ...entries: SeedScheduleEntry[]
): Promise<void> {
  const schedRepo = container.resolve('scheduleRepository') as ScheduleRepository;
  const schedules: Schedule[] = [];

  for (const entry of entries) {
    const schedResult = Schedule.create({
      resourceId,
      dayOfWeek: entry.dayOfWeek,
      startTime: entry.startTime,
      endTime: entry.endTime,
    });
    if (!schedResult.isOk) throw new Error('Failed to create schedule');
    schedules.push(schedResult.data);
  }

  await schedRepo.replaceAll(resourceId, schedules);
}

export interface SeedServiceOfferingProps {
  serviceId: string;
  resourceId: string;
  durationMinutes: number;
  slotIntervalMinutes: number;
  maxCapacity?: number;
  price?: number;
  serviceCode?: string;
}

/**
 * Create a service offering directly via the repository.
 * Registers the serviceCode-to-serviceId mapping internally.
 */
export async function seedServiceOffering(
  container: AwilixContainer,
  props: SeedServiceOfferingProps
): Promise<ServiceOffering> {
  const soRepo = container.resolve(
    'serviceOfferingRepository'
  ) as InMemoryServiceOfferingRepository;

  const soResult = ServiceOffering.create({
    serviceId: props.serviceId,
    resourceId: props.resourceId,
    maxCapacity: props.maxCapacity,
    duration: props.durationMinutes,
    slotInterval: props.slotIntervalMinutes,
    price: props.price,
  });
  if (!soResult.isOk) throw new Error('Failed to create service offering');
  const so = soResult.data;
  await soRepo.assign(so, props.serviceCode);
  return so;
}

export interface BookingSeedProps {
  container: AwilixContainer;
  customerId: string;
  customerCode: string;
  customerName: string;
  establishmentId: string;
  establishmentCode: string;
  serviceId: string;
  serviceCode: string;
  serviceName: string;
  resourceId: string;
  resourceCode: string;
  resourceName: string;
  startsAt: string;
  endsAt: string;
  status?: 'confirmed' | 'cancelled';
  servicePrice?: number;
  serviceDuration?: number;
}

/**
 * Create a booking directly via the repository.
 */
export async function seedBooking(props: BookingSeedProps): Promise<Booking> {
  const bkgRepo = props.container.resolve('bookingRepository') as BookingRepository;
  const bkgResult = Booking.create({
    customerId: props.customerId,
    customerCode: props.customerCode,
    customerName: props.customerName,
    establishmentId: props.establishmentId,
    establishmentCode: props.establishmentCode,
    serviceId: props.serviceId,
    serviceCode: props.serviceCode,
    serviceName: props.serviceName,
    resourceId: props.resourceId,
    resourceCode: props.resourceCode,
    resourceName: props.resourceName,
    startsAt: props.startsAt,
    endsAt: props.endsAt,
    servicePrice: props.servicePrice ?? 0,
    serviceDuration: props.serviceDuration ?? 60,
  });
  if (!bkgResult.isOk) throw new Error('Failed to create booking');
  const bkg = bkgResult.data;
  await bkgRepo.save(bkg);
  if (props.status === 'cancelled') {
    const cancelResult = bkg.cancel();
    if (!cancelResult.isOk) throw new Error('Failed to cancel booking');
    await bkgRepo.update(bkg);
  }
  return bkg;
}

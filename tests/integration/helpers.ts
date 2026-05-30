import type {
  BookingRepository,
  EstablishmentRepository,
  ResourceRepository,
  ServiceOfferingRepository,
  ServiceRepository,
} from '@app/domain/entities';
import {
  Booking,
  Establishment,
  Resource,
  Schedule,
  Service,
  ServiceOffering,
  User,
} from '@app/domain/entities';
import type { ScheduleRepository } from '@app/domain/entities/schedule';
import { signToken } from '@infrastructure/auth/jwt';
import type { AwilixContainer } from 'awilix';
import type { InMemoryUserRepository } from './repositories';

const TEST_JWT_SECRET = 'test-secret-key';

/**
 * Generate a JWT for testing purposes.
 */
export function createToken(userId: string, userCode: string, email: string): string {
  return signToken({ userId, userCode, email }, TEST_JWT_SECRET);
}

/**
 * Register a user directly via the in-memory repository and return a valid JWT.
 */
export async function registerUser(
  container: AwilixContainer,
  email: string,
  name: string
): Promise<{ user: User; token: string }> {
  const userRepo = container.resolve('userRepository') as InMemoryUserRepository;
  const userResult = User.create({ email, name });
  if (!userResult.isOk) throw new Error('Failed to create user');
  const user = userResult.data;
  await userRepo.save(user);
  const token = createToken(user.id, user.code, user.email.value);
  return { user, token };
}

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

/**
 * Create a schedule entry directly via the repository.
 */
export async function seedSchedule(
  container: AwilixContainer,
  resourceId: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string
): Promise<void> {
  const schedRepo = container.resolve('scheduleRepository') as ScheduleRepository;
  const schedResult = Schedule.create({ resourceId, dayOfWeek, startTime, endTime });
  if (!schedResult.isOk) throw new Error('Failed to create schedule');
  const sched = schedResult.data;
  await schedRepo.replaceAll(resourceId, [sched]);
}

/**
 * Create a service offering directly via the repository.
 */
export async function seedServiceOffering(
  container: AwilixContainer,
  serviceId: string,
  resourceId: string,
  durationMinutes: number,
  slotIntervalMinutes: number,
  maxCapacity = 1,
  price = 0
): Promise<ServiceOffering> {
  const soRepo = container.resolve('serviceOfferingRepository') as ServiceOfferingRepository;
  const soResult = ServiceOffering.create({
    serviceId,
    resourceId,
    maxCapacity,
    duration: durationMinutes,
    slotInterval: slotIntervalMinutes,
    price,
  });
  if (!soResult.isOk) throw new Error('Failed to create service offering');
  const so = soResult.data;
  await soRepo.assign(so);
  return so;
}

/**
 * Create a booking directly via the repository.
 */
export async function seedBooking(
  container: AwilixContainer,
  customerId: string,
  customerCode: string,
  customerName: string,
  establishmentId: string,
  establishmentCode: string,
  serviceId: string,
  serviceCode: string,
  serviceName: string,
  resourceId: string,
  resourceCode: string,
  resourceName: string,
  startsAt: string,
  endsAt: string,
  status: 'confirmed' | 'cancelled' = 'confirmed',
  servicePrice = 0,
  serviceDuration = 60
): Promise<Booking> {
  const bkgRepo = container.resolve('bookingRepository') as BookingRepository;
  const bkgResult = Booking.create({
    customerId,
    customerCode,
    customerName,
    establishmentId,
    establishmentCode,
    serviceId,
    serviceCode,
    serviceName,
    resourceId,
    resourceCode,
    resourceName,
    startsAt,
    endsAt,
    servicePrice,
    serviceDuration,
  });
  if (!bkgResult.isOk) throw new Error('Failed to create booking');
  const bkg = bkgResult.data;
  await bkgRepo.save(bkg);
  return bkg;
}

import type { Establishment, Resource, Service, User } from '@app/domain/entities';
import type { AwilixContainer } from 'awilix';
import { registerUser } from './auth';
import {
  seedEstablishment,
  seedResource,
  seedSchedule,
  seedService,
  seedServiceOffering,
} from './seeds';

export interface FullScenario {
  user: User;
  token: string;
  establishment: Establishment;
  resource: Resource;
  service: Service;
}

/**
 * Create a complete test scenario: user → establishment → resource → service → offering → schedule.
 */
export async function setupFullScenario(
  container: AwilixContainer,
  overrides?: {
    resourceName?: string;
    serviceName?: string;
    serviceDuration?: number;
    offeringDurationMinutes?: number;
    offeringSlotIntervalMinutes?: number;
    scheduleEntries?: { dayOfWeek: number; startTime: string; endTime: string }[];
  }
): Promise<FullScenario> {
  const { user, token } = await registerUser(container, 'owner@test.com', 'Owner');
  const establishment = await seedEstablishment(container, 'Salon', user.id, 'UTC');
  const resource = await seedResource(
    container,
    overrides?.resourceName ?? 'Alice',
    establishment.id,
    establishment.code
  );
  const service = await seedService(
    container,
    overrides?.serviceName ?? 'Haircut',
    overrides?.serviceDuration ?? 60,
    establishment.id,
    establishment.code
  );
  await seedServiceOffering(container, {
    serviceId: service.id,
    resourceId: resource.id,
    durationMinutes: overrides?.offeringDurationMinutes ?? 60,
    slotIntervalMinutes: overrides?.offeringSlotIntervalMinutes ?? 60,
    serviceCode: service.code,
  });

  const entries = overrides?.scheduleEntries ?? [
    { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
  ];
  await seedSchedule(container, resource.id, ...entries);

  return { user, token, establishment, resource, service };
}

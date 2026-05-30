import { createServer } from '@infrastructure/server/server';
import type { AwilixContainer } from 'awilix';
import type { Express } from 'express';
import supertest from 'supertest';
import { createTestContainer } from './containers/test-container';

export interface TestContext {
  app: Express;
  container: AwilixContainer;
  request: supertest.Agent;
  clearAllRepositories(): void;
}

export function createTestContext(): TestContext {
  const container = createTestContainer();
  const app = createServer(container);

  function clearAllRepositories(): void {
    const repos = [
      'userRepository',
      'establishmentRepository',
      'resourceRepository',
      'scheduleRepository',
      'serviceRepository',
      'serviceOfferingRepository',
      'bookingRepository',
    ] as const;
    for (const name of repos) {
      const repo = container.resolve(name) as { clear?: () => void };
      if (repo.clear) repo.clear();
    }
  }

  return {
    app,
    container,
    request: supertest(app),
    clearAllRepositories,
  };
}

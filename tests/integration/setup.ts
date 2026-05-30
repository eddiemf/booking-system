import { createServer } from '@infrastructure/server/server';
import type { AwilixContainer } from 'awilix';
import type { Express } from 'express';
import supertest from 'supertest';
import type { MockAppleAuth, MockGoogleAuth } from './adapters';
import { createTestContainer } from './containers/test-container';

export interface TestContext {
  app: Express;
  container: AwilixContainer;
  request: supertest.Agent;
  clearAllRepositories(): void;
}

/**
 * Names of all in-memory repositories registered in the test container.
 * Add new in-memory repos here to ensure they are cleared between tests.
 */
type RepoRegistrationName =
  | 'userRepository'
  | 'establishmentRepository'
  | 'resourceRepository'
  | 'scheduleRepository'
  | 'serviceRepository'
  | 'serviceOfferingRepository'
  | 'bookingRepository';

const REPO_NAMES: RepoRegistrationName[] = [
  'userRepository',
  'establishmentRepository',
  'resourceRepository',
  'scheduleRepository',
  'serviceRepository',
  'serviceOfferingRepository',
  'bookingRepository',
];

interface Clearable {
  clear(): void;
}

interface ResettableMock {
  resetToDefaults(): void;
}

export function createTestContext(): TestContext {
  const container = createTestContainer();
  const app = createServer(container);

  function clearAllRepositories(): void {
    for (const name of REPO_NAMES) {
      const repo = container.resolve<Clearable>(name);
      repo.clear();
    }

    // Reset mock auth adapters to defaults
    try {
      const googleAuth = container.resolve<ResettableMock>('googleAuth');
      const appleAuth = container.resolve<ResettableMock>('appleAuth');
      googleAuth.resetToDefaults();
      appleAuth.resetToDefaults();
    } catch {
      // Ignore if adapters aren't registered
    }
  }

  return {
    app,
    container,
    request: supertest(app),
    clearAllRepositories,
  };
}

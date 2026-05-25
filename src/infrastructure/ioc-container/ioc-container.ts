import { CreateService } from '@app/use-cases';
import { getConfig } from '@config/config';
import { asClass, asValue, createContainer, InjectionMode } from 'awilix';
import { drizzle } from 'drizzle-orm/node-postgres';
import { PostgressServiceRepository } from '../repositories';
import { ServiceController } from '../server/controllers';

export const createIocContainer = () => {
  const config = getConfig();
  const container = createContainer({
    injectionMode: InjectionMode.CLASSIC,
    strict: true,
  }).register({
    // Controllers
    serviceController: asClass(ServiceController).singleton(),

    // Use cases
    createService: asClass(CreateService).singleton(),

    // Repositories
    serviceRepository: asClass(PostgressServiceRepository).singleton(),

    // Database
    db: asValue(drizzle(config.database.url)),
  });

  return container;
};

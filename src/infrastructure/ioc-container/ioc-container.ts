import {
  CreateEstablishment,
  CreateService,
  DeleteEstablishment,
  DeleteService,
  FindEstablishment,
  FindService,
  ListServices,
  UpdateEstablishment,
  UpdateService,
} from '@app/use-cases';
import { getConfig } from '@config/config';
import { asClass, asValue, createContainer, InjectionMode } from 'awilix';
import { drizzle } from 'drizzle-orm/node-postgres';
import { PostgressEstablishmentRepository, PostgressServiceRepository } from '../repositories';
import { EstablishmentController, ServiceController } from '../server/controllers';

export const createIocContainer = () => {
  const config = getConfig();
  const container = createContainer({
    injectionMode: InjectionMode.CLASSIC,
    strict: true,
  }).register({
    // Controllers
    establishmentController: asClass(EstablishmentController).singleton(),
    serviceController: asClass(ServiceController).singleton(),

    // Use cases
    createEstablishment: asClass(CreateEstablishment).singleton(),
    deleteEstablishment: asClass(DeleteEstablishment).singleton(),
    findEstablishment: asClass(FindEstablishment).singleton(),
    updateEstablishment: asClass(UpdateEstablishment).singleton(),
    createService: asClass(CreateService).singleton(),
    deleteService: asClass(DeleteService).singleton(),
    findService: asClass(FindService).singleton(),
    listServices: asClass(ListServices).singleton(),
    updateService: asClass(UpdateService).singleton(),

    // Repositories
    establishmentRepository: asClass(PostgressEstablishmentRepository).singleton(),
    serviceRepository: asClass(PostgressServiceRepository).singleton(),

    // Database
    db: asValue(drizzle(config.database.url)),
  });

  return container;
};

import {
  CreateEstablishment,
  CreateResource,
  CreateService,
  DeleteEstablishment,
  DeleteResource,
  DeleteService,
  FindEstablishment,
  FindService,
  GetCurrentUser,
  ListResources,
  ListServices,
  LoginWithGoogle,
  SetSchedule,
  UpdateEstablishment,
  UpdateResource,
  UpdateService,
} from '@app/use-cases';
import { getConfig } from '@config/config';
import { asClass, asValue, createContainer, InjectionMode } from 'awilix';
import { drizzle } from 'drizzle-orm/node-postgres';
import { GoogleAuthAdapter, JwtAdapter } from '../adapters';
import {
  PostgressEstablishmentRepository,
  PostgressResourceRepository,
  PostgressScheduleRepository,
  PostgressServiceRepository,
  PostgressUserRepository,
} from '../repositories';
import {
  AuthController,
  EstablishmentController,
  ResourceController,
  ScheduleController,
  ServiceController,
} from '../server/controllers';

export const createIocContainer = () => {
  const config = getConfig();
  const container = createContainer({
    injectionMode: InjectionMode.CLASSIC,
    strict: true,
  }).register({
    // Config (needed by server.ts)
    config: asValue(config),

    // Controllers
    authController: asClass(AuthController).singleton(),
    establishmentController: asClass(EstablishmentController).singleton(),
    resourceController: asClass(ResourceController).singleton(),
    scheduleController: asClass(ScheduleController).singleton(),
    serviceController: asClass(ServiceController).singleton(),

    // Use cases
    createEstablishment: asClass(CreateEstablishment).singleton(),
    deleteEstablishment: asClass(DeleteEstablishment).singleton(),
    findEstablishment: asClass(FindEstablishment).singleton(),
    updateEstablishment: asClass(UpdateEstablishment).singleton(),
    createResource: asClass(CreateResource).singleton(),
    deleteResource: asClass(DeleteResource).singleton(),
    listResources: asClass(ListResources).singleton(),
    updateResource: asClass(UpdateResource).singleton(),
    setSchedule: asClass(SetSchedule).singleton(),
    createService: asClass(CreateService).singleton(),
    deleteService: asClass(DeleteService).singleton(),
    findService: asClass(FindService).singleton(),
    listServices: asClass(ListServices).singleton(),
    updateService: asClass(UpdateService).singleton(),

    loginWithGoogle: asClass(LoginWithGoogle).singleton(),
    getCurrentUser: asClass(GetCurrentUser).singleton(),

    // Repositories
    establishmentRepository: asClass(PostgressEstablishmentRepository).singleton(),
    resourceRepository: asClass(PostgressResourceRepository).singleton(),
    scheduleRepository: asClass(PostgressScheduleRepository).singleton(),
    serviceRepository: asClass(PostgressServiceRepository).singleton(),
    userRepository: asClass(PostgressUserRepository).singleton(),

    // Ports / Adapters
    googleAuthPort: asClass(GoogleAuthAdapter)
      .inject(() => ({ clientId: config.auth.googleClientId }))
      .singleton(),
    jwtPort: asClass(JwtAdapter)
      .inject(() => ({ jwtSecret: config.auth.jwtSecret }))
      .singleton(),

    // Database
    db: asValue(drizzle(config.database.url)),
  });

  return container;
};

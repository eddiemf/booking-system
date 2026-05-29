import { AvailabilityService } from '@app/domain/services';
import { EstablishmentLoader } from '@app/loaders';
import {
  CancelBooking,
  CreateBooking,
  CreateEstablishment,
  CreateResource,
  CreateService,
  CreateServiceOffering,
  DeleteEstablishment,
  DeleteResource,
  DeleteService,
  DeleteServiceOffering,
  FindEstablishment,
  FindService,
  GetAvailability,
  GetBooking,
  GetCurrentUser,
  ListBookings,
  ListEstablishments,
  ListResources,
  ListServices,
  LoginWithApple,
  LoginWithGoogle,
  SetSchedule,
  UpdateEstablishment,
  UpdateResource,
  UpdateService,
} from '@app/use-cases';
import { getConfig } from '@config/config';
import { asClass, asValue, createContainer, InjectionMode } from 'awilix';
import { drizzle } from 'drizzle-orm/node-postgres';
import { AppleAuthAdapter, GoogleAuthAdapter, JwtAdapter } from '../adapters';
import {
  PostgressBookingRepository,
  PostgressEstablishmentRepository,
  PostgressResourceRepository,
  PostgressScheduleRepository,
  PostgressServiceOfferingRepository,
  PostgressServiceRepository,
  PostgressUserRepository,
} from '../repositories';
import {
  AuthController,
  AvailabilityController,
  BookingController,
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
    availabilityController: asClass(AvailabilityController).singleton(),
    establishmentController: asClass(EstablishmentController).singleton(),
    resourceController: asClass(ResourceController).singleton(),
    scheduleController: asClass(ScheduleController).singleton(),
    serviceController: asClass(ServiceController).singleton(),
    bookingController: asClass(BookingController).singleton(),

    // Use cases
    createEstablishment: asClass(CreateEstablishment).singleton(),
    deleteEstablishment: asClass(DeleteEstablishment).singleton(),
    findEstablishment: asClass(FindEstablishment).singleton(),
    listEstablishments: asClass(ListEstablishments).singleton(),
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
    createServiceOffering: asClass(CreateServiceOffering).singleton(),
    deleteServiceOffering: asClass(DeleteServiceOffering).singleton(),
    createBooking: asClass(CreateBooking).singleton(),
    getBooking: asClass(GetBooking).singleton(),
    listBookings: asClass(ListBookings).singleton(),
    cancelBooking: asClass(CancelBooking).singleton(),
    getAvailability: asClass(GetAvailability).singleton(),
    loginWithGoogle: asClass(LoginWithGoogle).singleton(),
    loginWithApple: asClass(LoginWithApple).singleton(),
    getCurrentUser: asClass(GetCurrentUser).singleton(),

    // Loaders
    establishmentLoader: asClass(EstablishmentLoader).singleton(),

    // Domain services
    availabilityService: asClass(AvailabilityService).singleton(),

    // Repositories
    establishmentRepository: asClass(PostgressEstablishmentRepository).singleton(),
    resourceRepository: asClass(PostgressResourceRepository).singleton(),
    scheduleRepository: asClass(PostgressScheduleRepository).singleton(),
    serviceRepository: asClass(PostgressServiceRepository).singleton(),
    serviceOfferingRepository: asClass(PostgressServiceOfferingRepository).singleton(),
    bookingRepository: asClass(PostgressBookingRepository).singleton(),
    userRepository: asClass(PostgressUserRepository).singleton(),

    // Ports / Adapters
    appleAuth: asClass(AppleAuthAdapter)
      .inject(() => ({ clientId: config.auth.appleClientId }))
      .singleton(),
    googleAuth: asClass(GoogleAuthAdapter)
      .inject(() => ({ clientId: config.auth.googleClientId }))
      .singleton(),
    jwt: asClass(JwtAdapter)
      .inject(() => ({ jwtSecret: config.auth.jwtSecret }))
      .singleton(),

    // Database
    db: asValue(drizzle(config.database.url)),
  });

  return container;
};

import { AvailabilityService } from '@app/domain/services';
import { BookingLoader, EstablishmentLoader, ResourceLoader, ServiceLoader } from '@app/loaders';
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
import { JwtAdapter } from '@infrastructure/adapters';
import {
  AuthController,
  AvailabilityController,
  BookingController,
  EstablishmentController,
  ResourceController,
  ScheduleController,
  ServiceController,
} from '@infrastructure/server/controllers';
import { asClass, asValue, createContainer, InjectionMode } from 'awilix';
import { MockAppleAuth, MockGoogleAuth } from '../adapters';
import {
  InMemoryBookingRepository,
  InMemoryEstablishmentRepository,
  InMemoryResourceRepository,
  InMemoryScheduleRepository,
  InMemoryServiceOfferingRepository,
  InMemoryServiceRepository,
  InMemoryUserRepository,
} from '../repositories';

export function createTestContainer() {
  const db = {} as any;

  const container = createContainer({
    injectionMode: InjectionMode.CLASSIC,
    strict: true,
  });

  container.register({
    // Config
    config: asValue({
      auth: {
        jwtSecret: 'test-secret-key',
      },
    }),

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
    bookingLoader: asClass(BookingLoader).singleton(),
    establishmentLoader: asClass(EstablishmentLoader).singleton(),
    resourceLoader: asClass(ResourceLoader).singleton(),
    serviceLoader: asClass(ServiceLoader).singleton(),

    // Domain services
    availabilityService: asClass(AvailabilityService).singleton(),

    // In-memory repositories
    userRepository: asClass(InMemoryUserRepository).singleton(),
    establishmentRepository: asClass(InMemoryEstablishmentRepository).singleton(),
    resourceRepository: asClass(InMemoryResourceRepository).singleton(),
    scheduleRepository: asClass(InMemoryScheduleRepository).singleton(),
    serviceRepository: asClass(InMemoryServiceRepository).singleton(),
    serviceOfferingRepository: asClass(InMemoryServiceOfferingRepository).singleton(),
    bookingRepository: asClass(InMemoryBookingRepository).singleton(),

    // Mock auth adapters
    googleAuth: asClass(MockGoogleAuth).singleton(),
    appleAuth: asClass(MockAppleAuth).singleton(),

    // Real JWT with test secret
    jwt: asClass(JwtAdapter)
      .inject(() => ({ jwtSecret: 'test-secret-key' }))
      .singleton(),

    // Fake DB (not used)
    db: asValue(db),
  });

  // Wire schedule repo into resource repo for schedule hydration
  const resourceRepo = container.resolve('resourceRepository') as InMemoryResourceRepository;
  const scheduleRepo = container.resolve('scheduleRepository') as InMemoryScheduleRepository;
  resourceRepo.setScheduleRepo(scheduleRepo);

  return container;
}

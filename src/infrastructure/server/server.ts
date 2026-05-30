import express from 'express';
import { createIocContainer } from '../ioc-container';
import { type AuthenticatedRequest, getAuthMiddleware } from './middleware/auth-middleware';

export function createServer(container = createIocContainer()) {
  const app = express();

  const config = container.resolve('config');
  const authController = container.resolve('authController');
  const availabilityController = container.resolve('availabilityController');
  const establishmentController = container.resolve('establishmentController');
  const resourceController = container.resolve('resourceController');
  const scheduleController = container.resolve('scheduleController');
  const serviceController = container.resolve('serviceController');
  const bookingController = container.resolve('bookingController');

  const requireAuth = getAuthMiddleware(config.auth.jwtSecret);

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Auth routes
  app.post('/auth/google', (req, res) => authController.googleLogin(req, res));
  app.post('/auth/apple', (req, res) => authController.appleLogin(req, res));
  app.get('/auth/me', requireAuth, (req, res) =>
    authController.me(req as AuthenticatedRequest, res)
  );

  // Establishment routes
  app.post('/establishments', requireAuth, (req, res) =>
    establishmentController.create(req as AuthenticatedRequest, res)
  );
  app.get('/establishments', (req, res) => establishmentController.list(req, res));
  app.get('/establishments/:code', (req, res) => establishmentController.find(req, res));
  app.put('/establishments/:code', requireAuth, (req, res) =>
    establishmentController.update(req as AuthenticatedRequest, res)
  );
  app.delete('/establishments/:code', requireAuth, (req, res) =>
    establishmentController.delete(req as AuthenticatedRequest, res)
  );

  // Resource routes
  app.post('/establishments/:establishmentCode/resources', requireAuth, (req, res) =>
    resourceController.create(req as AuthenticatedRequest, res)
  );
  app.get('/establishments/:establishmentCode/resources', (req, res) =>
    resourceController.list(req, res)
  );
  app.put('/establishments/:establishmentCode/resources/:code', requireAuth, (req, res) =>
    resourceController.update(req as AuthenticatedRequest, res)
  );
  app.delete('/establishments/:establishmentCode/resources/:code', requireAuth, (req, res) =>
    resourceController.delete(req as AuthenticatedRequest, res)
  );

  // Schedule routes
  app.put(
    '/establishments/:establishmentCode/resources/:resourceCode/schedule',
    requireAuth,
    (req, res) => scheduleController.set(req as AuthenticatedRequest, res)
  );

  // Service routes
  app.post('/establishments/:establishmentCode/services', requireAuth, (req, res) =>
    serviceController.create(req as AuthenticatedRequest, res)
  );
  app.get('/establishments/:establishmentCode/services', (req, res) =>
    serviceController.list(req, res)
  );
  app.get('/establishments/:establishmentCode/services/:code', (req, res) =>
    serviceController.find(req, res)
  );
  app.put('/establishments/:establishmentCode/services/:code', requireAuth, (req, res) =>
    serviceController.update(req as AuthenticatedRequest, res)
  );
  app.delete('/establishments/:establishmentCode/services/:code', requireAuth, (req, res) =>
    serviceController.delete(req as AuthenticatedRequest, res)
  );

  // Service-Offering routes
  app.post(
    '/establishments/:establishmentCode/services/:code/service-offerings',
    requireAuth,
    (req, res) => serviceController.createOffering(req as AuthenticatedRequest, res)
  );
  app.delete(
    '/establishments/:establishmentCode/services/:code/service-offerings/:resourceCode',
    requireAuth,
    (req, res) => serviceController.deleteOffering(req as AuthenticatedRequest, res)
  );

  // Booking routes
  app.post('/bookings', requireAuth, (req, res) =>
    bookingController.create(req as AuthenticatedRequest, res)
  );
  app.get('/bookings/:code', requireAuth, (req, res) =>
    bookingController.get(req as AuthenticatedRequest, res)
  );
  app.get('/bookings', requireAuth, (req, res) =>
    bookingController.list(req as AuthenticatedRequest, res)
  );
  app.delete('/bookings/:code', requireAuth, (req, res) =>
    bookingController.cancel(req as AuthenticatedRequest, res)
  );

  // Availability routes (public)
  app.get('/establishments/:establishmentCode/services/:serviceCode/availability', (req, res) =>
    availabilityController.getSlots(req, res)
  );

  return app;
}

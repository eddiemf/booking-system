import express from 'express';
import { createIocContainer } from '../ioc-container';
import { type AuthenticatedRequest, getAuthMiddleware } from './middleware/auth-middleware';

export function createServer() {
  const app = express();
  const container = createIocContainer();
  const config = container.resolve('config');

  const authController = container.resolve('authController');
  const establishmentController = container.resolve('establishmentController');
  const resourceController = container.resolve('resourceController');
  const scheduleController = container.resolve('scheduleController');
  const serviceController = container.resolve('serviceController');

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const requireAuth = getAuthMiddleware(config.auth.jwtSecret);

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

  return app;
}

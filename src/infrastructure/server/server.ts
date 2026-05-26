import express from 'express';
import { createIocContainer } from '../ioc-container';

export function createServer() {
  const app = express();
  const container = createIocContainer();

  const establishmentController = container.resolve('establishmentController');
  const resourceController = container.resolve('resourceController');
  const scheduleController = container.resolve('scheduleController');
  const serviceController = container.resolve('serviceController');

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.post('/establishments', (req, res) => establishmentController.create(req, res));
  app.get('/establishments/:id', (req, res) => establishmentController.findById(req, res));
  app.put('/establishments/:id', (req, res) => establishmentController.update(req, res));
  app.delete('/establishments/:id', (req, res) => establishmentController.delete(req, res));
  app.post('/establishments/:establishmentId/resources', (req, res) =>
    resourceController.create(req, res)
  );
  app.get('/establishments/:establishmentId/resources', (req, res) =>
    resourceController.list(req, res)
  );
  app.put('/resources/:id', (req, res) => resourceController.update(req, res));
  app.delete('/resources/:id', (req, res) => resourceController.delete(req, res));
  app.put('/resources/:resourceId/schedule', (req, res) => scheduleController.set(req, res));
  app.post('/establishments/:establishmentId/services', (req, res) =>
    serviceController.create(req, res)
  );
  app.get('/establishments/:establishmentId/services', (req, res) =>
    serviceController.list(req, res)
  );
  app.get('/establishments/:establishmentId/services/:id', (req, res) =>
    serviceController.findById(req, res)
  );
  app.put('/establishments/:establishmentId/services/:id', (req, res) =>
    serviceController.update(req, res)
  );
  app.delete('/establishments/:establishmentId/services/:id', (req, res) =>
    serviceController.delete(req, res)
  );

  return app;
}

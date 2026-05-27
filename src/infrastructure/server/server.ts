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
  app.get('/establishments/:code', (req, res) => establishmentController.find(req, res));
  app.put('/establishments/:code', (req, res) => establishmentController.update(req, res));
  app.delete('/establishments/:code', (req, res) => establishmentController.delete(req, res));
  app.post('/establishments/:establishmentCode/resources', (req, res) =>
    resourceController.create(req, res)
  );
  app.get('/establishments/:establishmentCode/resources', (req, res) =>
    resourceController.list(req, res)
  );
  app.put('/establishments/:establishmentCode/resources/:code', (req, res) =>
    resourceController.update(req, res)
  );
  app.delete('/establishments/:establishmentCode/resources/:code', (req, res) =>
    resourceController.delete(req, res)
  );
  app.put('/establishments/:establishmentCode/resources/:resourceCode/schedule', (req, res) =>
    scheduleController.set(req, res)
  );
  app.post('/establishments/:establishmentCode/services', (req, res) =>
    serviceController.create(req, res)
  );
  app.get('/establishments/:establishmentCode/services', (req, res) =>
    serviceController.list(req, res)
  );
  app.get('/establishments/:establishmentCode/services/:code', (req, res) =>
    serviceController.find(req, res)
  );
  app.put('/establishments/:establishmentCode/services/:code', (req, res) =>
    serviceController.update(req, res)
  );
  app.delete('/establishments/:establishmentCode/services/:code', (req, res) =>
    serviceController.delete(req, res)
  );

  return app;
}

import express from 'express';
import { createIocContainer } from '../ioc-container';

export function createServer() {
  const app = express();
  const container = createIocContainer();

  const establishmentController = container.resolve('establishmentController');
  const serviceController = container.resolve('serviceController');

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.post('/establishments', (req, res) => establishmentController.create(req, res));
  app.post('/services', (req, res) => serviceController.create(req, res));

  return app;
}

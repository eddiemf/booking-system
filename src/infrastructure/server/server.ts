import express from 'express';
import { createIocContainer } from '../ioc-container';

export function createServer() {
  const app = express();
  const container = createIocContainer();

  const serviceController = container.resolve('serviceController');

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.post('/services', (req, res) => serviceController.create(req, res));

  return app;
}

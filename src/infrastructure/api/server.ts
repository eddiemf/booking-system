import express from 'express';
import { createContainer } from '../ioc-container';
import { ServiceController } from './controllers';
import { Config } from '../../config';

export const startServer = () => {
  const app = express();
  const container = createContainer();

  const serviceController = container.get(ServiceController);

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.post('/services', (req, res) => serviceController.createService(req, res));

  app.listen(3000, () => {
    console.log('Server is running on port 3000');
  });
};

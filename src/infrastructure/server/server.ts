import express from 'express';
import { createIocContainer } from '../ioc-container';

export const startServer = () => {
  const app = express();
  const container = createIocContainer();

  const serviceController = container.resolve('serviceController');

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.post('/services', (req, res) => serviceController.create(req, res));

  app.listen(3000, () => {
    console.log('Server is running on port 3000');
  });
};

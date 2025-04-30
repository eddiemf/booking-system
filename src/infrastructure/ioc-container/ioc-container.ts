import { ServiceRepository } from '@domain/entities';
import { PostgressServiceRepository } from '../repositories';
import { CreateService } from '@app/use-cases';
import { ServiceController } from '../api/controllers';
import { Container } from 'inversify';
import { getConfig } from '@config/config';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { TYPES } from '@shared/ioc-types';

export const createContainer = () => {
  const container = new Container();
  const config = getConfig();

  container.bind<NodePgDatabase>(TYPES.DbClient).toConstantValue(drizzle(config.database.url));
  container
    .bind<ServiceRepository>(TYPES.ServiceRepository)
    .to(PostgressServiceRepository)
    .inSingletonScope();
  container.bind(ServiceController).toSelf().inSingletonScope();
  container.bind(CreateService).toSelf().inSingletonScope();

  return container;
};

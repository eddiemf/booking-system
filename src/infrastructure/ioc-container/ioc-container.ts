import { CreateService } from '@app/use-cases';
import { getConfig } from '@config/config';
import type { ServiceRepository } from '@domain/entities';
import { TYPES } from '@shared/ioc-types';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Container } from 'inversify';
import { ServiceController } from '../api/controllers';
import { PostgressServiceRepository } from '../repositories';

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

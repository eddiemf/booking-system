import { ServiceRepository, ServiceRepositoryId } from '@domain/entities';
import { PostgressServiceRepository } from '../repositories';
import { CreateService } from '@app/use-cases';
import { ServiceController } from '../api/controllers';
import { Container } from 'inversify';

export const createContainer = () => {
  const container = new Container();

  container
    .bind<ServiceRepository>(ServiceRepositoryId)
    .to(PostgressServiceRepository)
    .inSingletonScope();
  container.bind(ServiceController).toSelf().inSingletonScope();
  container.bind(CreateService).toSelf().inSingletonScope();

  return container;
};

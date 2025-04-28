import { ServiceEntity, ServiceRepository } from '@domain/entities';
import { StorageError } from '@domain/errors';
import { Ok, PromiseResult } from '@shared/result';
import { injectable } from 'inversify';

@injectable()
export class PostgressServiceRepository implements ServiceRepository {
  save(service: ServiceEntity): PromiseResult<void, StorageError> {
    return new Promise((resolve) => {
      // Simulate a database save operation
      setTimeout(() => {
        console.log('Service saved:', service);
        resolve(Ok(undefined));
      }, 1000);
    });
  }
}

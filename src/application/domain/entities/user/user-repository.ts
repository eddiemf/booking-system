import type { StorageError } from '@app/domain/errors';
import type { PromiseResult } from '@shared/result';
import type { UserEntity } from './user-entity';

export interface UserRepository {
  findById(id: string): PromiseResult<UserEntity | null, StorageError>;
  findByEmail(email: string): PromiseResult<UserEntity | null, StorageError>;
  save(user: UserEntity): PromiseResult<UserEntity, StorageError>;
}

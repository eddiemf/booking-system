import type { StorageError } from '@app/domain/errors';
import type { PromiseResult } from '@shared/result';
import type { User } from './user-entity';

export interface UserRepository {
  findById(id: string): PromiseResult<User | null, StorageError>;
  findByEmail(email: string): PromiseResult<User | null, StorageError>;
  save(user: User): PromiseResult<User, StorageError>;
}

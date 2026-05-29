import { User, type UserRepository } from '@app/domain/entities';
import { StorageError } from '@app/domain/errors';
import type { PrismaClient } from '@prisma/client';
import { fail, ok, type PromiseResult } from '@shared/result';

export class PostgressUserRepository implements UserRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): PromiseResult<User | null, StorageError> {
    try {
      const row = await this.db.user.findFirst({
        where: { id },
      });

      if (!row) return ok(null);

      return ok(
        User.reconstruct({
          id: row.id,
          code: row.code,
          email: row.email,
          name: row.name,
        })
      );
    } catch {
      return fail(new StorageError('Failed to find user.'));
    }
  }

  async findByEmail(email: string): PromiseResult<User | null, StorageError> {
    try {
      const row = await this.db.user.findFirst({
        where: { email },
      });

      if (!row) return ok(null);

      return ok(
        User.reconstruct({
          id: row.id,
          code: row.code,
          email: row.email,
          name: row.name,
        })
      );
    } catch {
      return fail(new StorageError('Failed to find user.'));
    }
  }

  async save(user: User): PromiseResult<User, StorageError> {
    try {
      await this.db.user.create({
        data: {
          id: user.id,
          code: user.code,
          email: user.email.value,
          name: user.name,
        },
      });
      return ok(user);
    } catch {
      return fail(new StorageError('Failed to save user.'));
    }
  }
}

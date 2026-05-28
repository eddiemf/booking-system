import { User, type UserRepository } from '@app/domain/entities';
import { StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { usersTable } from '../../db/schema';

export class PostgressUserRepository implements UserRepository {
  constructor(private readonly db: NodePgDatabase) {}

  async findById(id: string): PromiseResult<User | null, StorageError> {
    try {
      const rows = await this.db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);

      const row = rows[0];
      if (!row) return ok(null);

      return ok(
        User.reconstruct({
          id: row.id,
          code: row.code,
          email: row.email,
          name: row.name,
        })
      );
    } catch (error) {
      return fail(new StorageError('Failed to find user.'));
    }
  }

  async findByEmail(email: string): PromiseResult<User | null, StorageError> {
    try {
      const rows = await this.db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .limit(1);

      const row = rows[0];
      if (!row) return ok(null);

      return ok(
        User.reconstruct({
          id: row.id,
          code: row.code,
          email: row.email,
          name: row.name,
        })
      );
    } catch (error) {
      return fail(new StorageError('Failed to find user.'));
    }
  }

  async save(user: User): PromiseResult<User, StorageError> {
    try {
      await this.db.insert(usersTable).values({
        id: user.id,
        code: user.code,
        email: user.email.value,
        name: user.name,
      });
      return ok(user);
    } catch (error) {
      return fail(new StorageError('Failed to save user.'));
    }
  }
}

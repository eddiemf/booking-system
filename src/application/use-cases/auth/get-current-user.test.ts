import { User, type UserRepository } from '@app/domain/entities';
import { NotFoundError, StorageError } from '@app/domain/errors';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { GetCurrentUser } from './get-current-user';

describe('GetCurrentUser', () => {
  const userRepository = mock<UserRepository>();
  const useCase = new GetCurrentUser(userRepository);

  const existingUser = User.reconstruct({
    id: 'uuid-user',
    code: 'usr123',
    email: 'alice@example.com',
    name: 'Alice',
  });

  it('returns not-found error when user does not exist', async () => {
    userRepository.findById.mockResolvedValue(ok(null));

    const error = await useCase
      .execute({ userId: 'uuid-user' })
      .then((result) => result.getError());

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('returns storage error when repository fails', async () => {
    userRepository.findById.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase
      .execute({ userId: 'uuid-user' })
      .then((result) => result.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns user DTO on success', async () => {
    userRepository.findById.mockResolvedValue(ok(existingUser));

    const data = await useCase.execute({ userId: 'uuid-user' }).then((result) => result.getData());

    expect(data).toEqual({ id: 'usr123', email: 'alice@example.com', name: 'Alice' });
  });
});

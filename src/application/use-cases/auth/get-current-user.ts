import type { UserRepository } from '@app/domain/entities';
import { NotFoundError, type StorageError } from '@app/domain/errors';
import { fail, ok, type PromiseResult } from '@shared/result';
import type { UserDTO } from '../../dtos';
import { UserMapper } from '../../mappers/user';

type Input = {
  userId: string;
};

export class GetCurrentUser {
  constructor(private readonly userRepository: UserRepository) {}

  async execute({ userId }: Input): PromiseResult<UserDTO, StorageError | NotFoundError> {
    const result = await this.userRepository.findById(userId);
    if (!result.isOk) return result;
    if (!result.data) return fail(new NotFoundError('User', userId));

    return ok(UserMapper.toDTO(result.data));
  }
}

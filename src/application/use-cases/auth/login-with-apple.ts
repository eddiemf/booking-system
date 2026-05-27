import type { UserRepository } from '@app/domain/entities';
import { UserEntity } from '@app/domain/entities';
import type { AuthenticationError, StorageError, ValidationError } from '@app/domain/errors';
import type { AppleAuthPort, JwtPort } from '@app/ports';
import { fail, ok, type PromiseResult } from '@shared/result';
import type { AuthDTO } from '../../dtos/auth-dto';
import { UserMapper } from '../../mappers/user';

type Input = {
  token: string;
};

type LoginError = AuthenticationError | StorageError | ValidationError;

export class LoginWithApple {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly appleAuth: AppleAuthPort,
    private readonly jwt: JwtPort
  ) {}

  async execute({ token }: Input): PromiseResult<AuthDTO, LoginError> {
    const appleResult = await this.appleAuth.verifyToken(token);
    if (!appleResult.isOk) return appleResult;

    const appleUser = appleResult.data;

    const userResult = await this.findOrCreateUser(appleUser.email, appleUser.name);
    if (!userResult.isOk) return userResult;

    const user = userResult.data;

    const jwt = this.jwt.sign({
      userId: user.id,
      userCode: user.code,
      email: user.email.value,
    });

    return ok({
      token: jwt,
      user: UserMapper.toDTO(user),
    });
  }

  private async findOrCreateUser(
    email: string,
    name: string
  ): PromiseResult<UserEntity, StorageError | ValidationError> {
    const existing = await this.userRepository.findByEmail(email);
    if (!existing.isOk) return existing;
    if (existing.data) return ok(existing.data);

    const created = UserEntity.create({ email, name });
    if (!created.isOk) return created;

    return this.userRepository.save(created.data);
  }
}

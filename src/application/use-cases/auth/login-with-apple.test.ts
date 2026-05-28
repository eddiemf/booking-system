import { User, type UserRepository } from '@app/domain/entities';
import { AuthenticationError, StorageError } from '@app/domain/errors';
import type { AppleAuthPort, JwtPort } from '@app/ports';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { LoginWithApple } from './login-with-apple';

describe('LoginWithApple', () => {
  const userRepository = mock<UserRepository>();
  const appleAuthPort = mock<AppleAuthPort>();
  const jwtPort = mock<JwtPort>();

  const validToken = 'valid-apple-token';
  const appleUser = { email: 'alice@example.com', name: 'Alice' };
  const existingUser = User.reconstruct({
    id: 'uuid-user',
    code: 'usr123',
    email: 'alice@example.com',
    name: 'Alice',
  });

  const createUseCase = () => new LoginWithApple(userRepository, appleAuthPort, jwtPort);

  it('returns authentication error when apple token is invalid', async () => {
    const useCase = createUseCase();
    appleAuthPort.verifyToken.mockResolvedValue(
      fail(new AuthenticationError('Invalid or expired Apple token.'))
    );

    const error = await useCase.execute({ token: 'bad' }).then((r) => r.getError());

    expect(error).toBeInstanceOf(AuthenticationError);
  });

  it('returns storage error when findByEmail fails', async () => {
    const useCase = createUseCase();
    appleAuthPort.verifyToken.mockResolvedValue(ok(appleUser));
    userRepository.findByEmail.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase.execute({ token: validToken }).then((r) => r.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns the existing user and signs a JWT when user already exists', async () => {
    const useCase = createUseCase();
    appleAuthPort.verifyToken.mockResolvedValue(ok(appleUser));
    userRepository.findByEmail.mockResolvedValue(ok(existingUser));
    jwtPort.sign.mockReturnValue('signed-jwt');

    const data = await useCase.execute({ token: validToken }).then((r) => r.getData());

    expect(data.token).toBe('signed-jwt');
    expect(data.user).toEqual({ id: 'usr123', email: 'alice@example.com', name: 'Alice' });
    expect(jwtPort.sign).toHaveBeenCalledWith({
      userId: 'uuid-user',
      userCode: 'usr123',
      email: 'alice@example.com',
    });
  });

  it('creates a new user when email is not registered', async () => {
    const useCase = createUseCase();
    appleAuthPort.verifyToken.mockResolvedValue(ok(appleUser));
    userRepository.findByEmail.mockResolvedValue(ok(null));
    userRepository.save.mockResolvedValue(ok(existingUser));
    jwtPort.sign.mockReturnValue('signed-jwt');

    const data = await useCase.execute({ token: validToken }).then((r) => r.getData());

    expect(userRepository.save).toHaveBeenCalledWith(expect.objectContaining({ name: 'Alice' }));
    expect(data.token).toBe('signed-jwt');
    expect(data.user.email).toBe('alice@example.com');
  });

  it('returns storage error when save fails', async () => {
    const useCase = createUseCase();
    appleAuthPort.verifyToken.mockResolvedValue(ok(appleUser));
    userRepository.findByEmail.mockResolvedValue(ok(null));
    userRepository.save.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase.execute({ token: validToken }).then((r) => r.getError());

    expect(error).toBeInstanceOf(StorageError);
  });
});

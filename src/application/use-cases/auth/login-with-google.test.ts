import { UserEntity, type UserRepository } from '@app/domain/entities';
import { AuthenticationError, StorageError } from '@app/domain/errors';
import type { GoogleAuthPort, JwtPort } from '@app/ports';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { LoginWithGoogle } from './login-with-google';

describe('LoginWithGoogle', () => {
  const userRepository = mock<UserRepository>();
  const googleAuthPort = mock<GoogleAuthPort>();
  const jwtPort = mock<JwtPort>();

  const validToken = 'valid-google-token';
  const googleUser = { email: 'alice@example.com', name: 'Alice' };
  const existingUser = UserEntity.reconstruct({
    id: 'uuid-user',
    code: 'usr123',
    email: 'alice@example.com',
    name: 'Alice',
  });

  const createUseCase = () => new LoginWithGoogle(userRepository, googleAuthPort, jwtPort);

  it('returns authentication error when google token is invalid', async () => {
    const useCase = createUseCase();
    googleAuthPort.verifyToken.mockResolvedValue(
      fail(new AuthenticationError('Invalid or expired Google token.'))
    );

    const error = await useCase.execute({ token: 'bad' }).then((r) => r.getError());

    expect(error).toBeInstanceOf(AuthenticationError);
  });

  it('returns storage error when findByEmail fails', async () => {
    const useCase = createUseCase();
    googleAuthPort.verifyToken.mockResolvedValue(ok(googleUser));
    userRepository.findByEmail.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase.execute({ token: validToken }).then((r) => r.getError());

    expect(error).toBeInstanceOf(StorageError);
  });

  it('returns the existing user and signs a JWT when user already exists', async () => {
    const useCase = createUseCase();
    googleAuthPort.verifyToken.mockResolvedValue(ok(googleUser));
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
    googleAuthPort.verifyToken.mockResolvedValue(ok(googleUser));
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
    googleAuthPort.verifyToken.mockResolvedValue(ok(googleUser));
    userRepository.findByEmail.mockResolvedValue(ok(null));
    userRepository.save.mockResolvedValue(fail(new StorageError('DB error')));

    const error = await useCase.execute({ token: validToken }).then((r) => r.getError());

    expect(error).toBeInstanceOf(StorageError);
  });
});

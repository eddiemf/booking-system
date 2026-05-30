import { User } from '@app/domain/entities';
import { signToken } from '@infrastructure/auth/jwt';
import type { AwilixContainer } from 'awilix';
import type { InMemoryUserRepository } from '../repositories';

const TEST_JWT_SECRET = 'test-secret-key';

/**
 * Generate a JWT for testing purposes.
 */
export function createToken(userId: string, userCode: string, email: string): string {
  return signToken({ userId, userCode, email }, TEST_JWT_SECRET);
}

/**
 * Register a user directly via the in-memory repository and return a valid JWT.
 */
export async function registerUser(
  container: AwilixContainer,
  email: string,
  name: string
): Promise<{ user: User; token: string }> {
  const userRepo = container.resolve('userRepository') as InMemoryUserRepository;
  const userResult = User.create({ email, name });
  if (!userResult.isOk) throw new Error('Failed to create user');
  const user = userResult.data;
  await userRepo.save(user);
  const token = createToken(user.id, user.code, user.email.value);
  return { user, token };
}

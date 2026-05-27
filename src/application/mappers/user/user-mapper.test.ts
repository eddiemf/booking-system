import { UserEntity } from '@app/domain/entities';
import { describe, expect, it } from 'vitest';
import { UserMapper } from './user-mapper';

describe('UserMapper', () => {
  describe('toDTO()', () => {
    it('maps from entity to DTO', () => {
      const entity = UserEntity.reconstruct({
        id: 'uuid-123',
        code: 'usr123',
        email: 'alice@example.com',
        name: 'Alice',
      });

      const dto = UserMapper.toDTO(entity);

      expect(dto).not.toBeInstanceOf(UserEntity);
      expect(dto).toEqual({
        id: 'usr123',
        email: 'alice@example.com',
        name: 'Alice',
      });
    });
  });
});

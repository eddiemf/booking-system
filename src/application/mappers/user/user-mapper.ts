import type { UserEntity } from '@app/domain/entities';
import type { UserDTO } from '@app/dtos';

export class UserMapper {
  static toDTO(user: UserEntity): UserDTO {
    return {
      id: user.code,
      email: user.email.value,
      name: user.name,
    };
  }
}

import type { User } from '@app/domain/entities';
import type { UserDTO } from '@app/dtos';

export class UserMapper {
  static toDTO(user: User): UserDTO {
    return {
      id: user.code,
      email: user.email.value,
      name: user.name,
    };
  }
}

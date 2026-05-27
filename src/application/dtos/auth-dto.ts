import type { UserDTO } from './user-dto';

export interface AuthDTO {
  token: string;
  user: UserDTO;
}

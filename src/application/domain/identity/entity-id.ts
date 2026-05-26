import { v7 } from 'uuid';

export class EntityId {
  static generate(): string {
    return v7();
  }
}

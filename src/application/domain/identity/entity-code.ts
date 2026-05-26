import { nanoid } from 'nanoid';

export class EntityCode {
  static generate(): string {
    return nanoid(10);
  }
}

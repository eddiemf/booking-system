import { ServiceEntity } from '@domain/entities';

export const getMockedServiceEntity = () => {
  return {
    getId: jest.fn(),
    getName: jest.fn(),
    getDescription: jest.fn(),
    getDuration: jest.fn(),
  } as unknown as ServiceEntity;
};

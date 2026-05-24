import { CreateService } from "@app/use-cases";
import { getConfig } from "@config/config";
import { asClass, asValue, createContainer, InjectionMode } from "awilix";
import { drizzle } from "drizzle-orm/node-postgres";
import { ServiceController } from "../api/controllers";
import { PostgressServiceRepository } from "../repositories";

export const createIocContainer = () => {
  const config = getConfig();
  const container = createContainer({
    injectionMode: InjectionMode.CLASSIC,
  }).register({
    db: asValue(drizzle(config.database.url)),
    serviceRepository: asClass(PostgressServiceRepository).singleton(),
    createServiceUseCase: asClass(CreateService).singleton(),
    serviceController: asClass(ServiceController).singleton(),
  });

  return container;
};

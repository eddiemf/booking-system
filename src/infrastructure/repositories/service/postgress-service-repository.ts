import type { ServiceEntity, ServiceRepository } from "@domain/entities";
import type { StorageError } from "@domain/errors";
import { Ok, type PromiseResult } from "@shared/result";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { servicesTable } from "../../db/schema";

export class PostgressServiceRepository implements ServiceRepository {
  constructor(private readonly db: NodePgDatabase) {}

  async save(service: ServiceEntity): PromiseResult<void, StorageError> {
    try {
      await this.db.insert(servicesTable).values({
        name: service.getName(),
        description: service.getDescription(),
        duration: service.getDuration(),
      });
    } catch (error) {}

    return Ok(undefined);
  }
}

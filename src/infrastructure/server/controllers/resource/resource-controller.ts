import type { ResourceType } from '@app/domain/entities';
import type { ResourceDTO } from '@app/dtos';
import type { CreateResource, DeleteResource, ListResources, UpdateResource } from '@app/use-cases';
import type { Request, Response } from 'express';
import z from 'zod';
import { Controller, type ErrorResponse } from '../controller';

export class ResourceController extends Controller {
  private readonly resourceSchema = z.object({
    name: z.string(),
    type: z.enum(['employee', 'room']),
  });

  constructor(
    private readonly createResource: CreateResource,
    private readonly listResources: ListResources,
    private readonly updateResource: UpdateResource,
    private readonly deleteResource: DeleteResource
  ) {
    super();
  }

  async create(req: Request, res: Response<ResourceDTO | ErrorResponse>) {
    try {
      const validation = this.resourceSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json(this.mapZodValidationError(validation.error));
      }

      const { name, type } = validation.data;
      const establishmentId = String(req.params.establishmentId);

      const result = await this.createResource.execute({ name, type, establishmentId });

      if (!result.isOk) {
        if (result.error.code === 'ValidationError') {
          return res.status(400).json(this.mapErrorFromResult(result));
        }
        if (result.error.code === 'NotFoundError') {
          return res.status(404).json(this.mapErrorFromResult(result));
        }

        return res.status(500).json(this.getInternalServerError());
      }

      return res.status(201).json(result.data);
    } catch (error) {
      return res.status(500).json(this.getInternalServerError());
    }
  }

  async list(req: Request, res: Response<ResourceDTO[] | ErrorResponse>) {
    try {
      const establishmentId = String(req.params.establishmentId);
      const rawType = req.query.type;
      const type =
        rawType === 'employee' || rawType === 'room' ? (rawType as ResourceType) : undefined;

      const result = await this.listResources.execute(
        type ? { establishmentId, type } : { establishmentId }
      );

      if (!result.isOk) {
        if (result.error.code === 'NotFoundError') {
          return res.status(404).json(this.mapErrorFromResult(result));
        }

        return res.status(500).json(this.getInternalServerError());
      }

      return res.status(200).json(result.data);
    } catch (error) {
      return res.status(500).json(this.getInternalServerError());
    }
  }

  async update(req: Request, res: Response<ResourceDTO | ErrorResponse>) {
    try {
      const validation = this.resourceSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json(this.mapZodValidationError(validation.error));
      }

      const { name, type } = validation.data;
      const id = String(req.params.id);

      const result = await this.updateResource.execute({ id, name, type });

      if (!result.isOk) {
        if (result.error.code === 'ValidationError') {
          return res.status(400).json(this.mapErrorFromResult(result));
        }
        if (result.error.code === 'NotFoundError') {
          return res.status(404).json(this.mapErrorFromResult(result));
        }

        return res.status(500).json(this.getInternalServerError());
      }

      return res.status(200).json(result.data);
    } catch (error) {
      return res.status(500).json(this.getInternalServerError());
    }
  }

  async delete(req: Request, res: Response<ErrorResponse | void>) {
    try {
      const id = String(req.params.id);

      const result = await this.deleteResource.execute({ id });

      if (!result.isOk) {
        if (result.error.code === 'NotFoundError') {
          return res.status(404).json(this.mapErrorFromResult(result));
        }
        if (result.error.code === 'ConflictError') {
          return res.status(409).json(this.mapErrorFromResult(result));
        }

        return res.status(500).json(this.getInternalServerError());
      }

      return res.status(204).send();
    } catch (error) {
      return res.status(500).json(this.getInternalServerError());
    }
  }
}

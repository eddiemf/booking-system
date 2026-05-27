import type { ResourceDTO } from '@app/dtos';
import type { CreateResource, DeleteResource, ListResources, UpdateResource } from '@app/use-cases';
import type { Request, Response } from 'express';
import z from 'zod';
import { Controller, type ErrorResponse } from '../controller';

export class ResourceController extends Controller {
  private readonly createResourceSchema = z.object({
    establishmentCode: z.string().min(1),
    name: z.string(),
  });

  private readonly establishmentParamsSchema = z.object({
    establishmentCode: z.string().min(1),
  });

  private readonly resourceParamsSchema = z.object({
    establishmentCode: z.string().min(1),
    code: z.string().min(1),
  });

  private readonly updateResourceSchema = z.object({
    establishmentCode: z.string().min(1),
    code: z.string().min(1),
    name: z.string(),
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
      const validation = this.createResourceSchema.safeParse({ ...req.params, ...req.body });
      if (!validation.success) {
        return res.status(400).json(this.mapZodValidationError(validation.error));
      }

      const { establishmentCode, name } = validation.data;

      const result = await this.createResource.execute({ name, establishmentCode });

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
      const paramsValidation = this.establishmentParamsSchema.safeParse(req.params);
      if (!paramsValidation.success) {
        return res.status(400).json(this.mapZodValidationError(paramsValidation.error));
      }
      const { establishmentCode } = paramsValidation.data;

      const result = await this.listResources.execute({ establishmentCode });

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
      const validation = this.updateResourceSchema.safeParse({ ...req.params, ...req.body });
      if (!validation.success) {
        return res.status(400).json(this.mapZodValidationError(validation.error));
      }

      const { code, establishmentCode, name } = validation.data;

      const result = await this.updateResource.execute({ code, establishmentCode, name });

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
      const paramsValidation = this.resourceParamsSchema.safeParse(req.params);
      if (!paramsValidation.success) {
        return res.status(400).json(this.mapZodValidationError(paramsValidation.error));
      }
      const { code, establishmentCode } = paramsValidation.data;

      const result = await this.deleteResource.execute({ code, establishmentCode });

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

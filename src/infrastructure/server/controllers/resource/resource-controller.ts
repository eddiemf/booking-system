import type { ResourceDTO } from '@app/dtos';
import type { CreateResource, DeleteResource, ListResources, UpdateResource } from '@app/use-cases';
import type { Request, Response } from 'express';
import z from 'zod';
import type { AuthenticatedRequest } from '../../middleware/auth-middleware';
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

  async create(req: AuthenticatedRequest, res: Response<ResourceDTO | ErrorResponse>) {
    try {
      const validation = this.createResourceSchema.safeParse({ ...req.params, ...req.body });
      if (!validation.success) {
        return this.sendZodError(res, validation.error);
      }

      const { establishmentCode, name } = validation.data;

      const result = await this.createResource.execute({
        name,
        establishmentCode,
        userId: req.user.userId,
      });

      if (!result.isOk) return this.sendError(res, result);

      return res.status(201).json(result.data);
    } catch (error) {
      return this.sendError(res);
    }
  }

  async list(req: Request, res: Response<ResourceDTO[] | ErrorResponse>) {
    try {
      const paramsValidation = this.establishmentParamsSchema.safeParse(req.params);
      if (!paramsValidation.success) {
        return this.sendZodError(res, paramsValidation.error);
      }
      const { establishmentCode } = paramsValidation.data;

      const result = await this.listResources.execute({ establishmentCode });

      if (!result.isOk) return this.sendError(res, result);

      return res.status(200).json(result.data);
    } catch (error) {
      return this.sendError(res);
    }
  }

  async update(req: AuthenticatedRequest, res: Response<ResourceDTO | ErrorResponse>) {
    try {
      const validation = this.updateResourceSchema.safeParse({ ...req.params, ...req.body });
      if (!validation.success) {
        return this.sendZodError(res, validation.error);
      }

      const { code, establishmentCode, name } = validation.data;

      const result = await this.updateResource.execute({
        code,
        establishmentCode,
        name,
        userId: req.user.userId,
      });

      if (!result.isOk) return this.sendError(res, result);

      return res.status(200).json(result.data);
    } catch (error) {
      return this.sendError(res);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response<ErrorResponse | void>) {
    try {
      const paramsValidation = this.resourceParamsSchema.safeParse(req.params);
      if (!paramsValidation.success) {
        return this.sendZodError(res, paramsValidation.error);
      }
      const { code, establishmentCode } = paramsValidation.data;

      const result = await this.deleteResource.execute({
        code,
        establishmentCode,
        userId: req.user.userId,
      });

      if (!result.isOk) return this.sendError(res, result);

      return res.status(204).send();
    } catch (error) {
      return this.sendError(res);
    }
  }
}

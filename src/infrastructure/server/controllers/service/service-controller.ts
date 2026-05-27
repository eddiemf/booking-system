import type { ServiceDTO } from '@app/dtos';
import type {
  CreateService,
  DeleteService,
  FindService,
  ListServices,
  UpdateService,
} from '@app/use-cases';
import type { Request, Response } from 'express';
import z from 'zod';
import type { AuthenticatedRequest } from '../../middleware/auth-middleware';
import { Controller, type ErrorResponse } from '../controller';

export class ServiceController extends Controller {
  private readonly createServiceSchema = z.object({
    establishmentCode: z.string().min(1),
    name: z.string(),
    description: z.string().optional(),
    duration: z.coerce.number(),
  });

  private readonly establishmentParamsSchema = z.object({
    establishmentCode: z.string().min(1),
  });

  private readonly serviceParamsSchema = z.object({
    code: z.string().min(1),
    establishmentCode: z.string().min(1),
  });

  private readonly updateServiceSchema = z.object({
    code: z.string().min(1),
    establishmentCode: z.string().min(1),
    name: z.string(),
    description: z.string().optional(),
    duration: z.coerce.number(),
  });

  constructor(
    private readonly createService: CreateService,
    private readonly listServices: ListServices,
    private readonly findService: FindService,
    private readonly updateService: UpdateService,
    private readonly deleteService: DeleteService
  ) {
    super();
  }

  async create(req: AuthenticatedRequest, res: Response<ServiceDTO | ErrorResponse>) {
    try {
      const validation = this.createServiceSchema.safeParse({ ...req.params, ...req.body });
      if (!validation.success) {
        return res.status(400).json(this.mapZodValidationError(validation.error));
      }

      const { establishmentCode, name, description, duration } = validation.data;

      const result = await this.createService.execute({
        name,
        description,
        duration,
        establishmentCode,
        userId: req.user.userId,
      });

      if (!result.isOk) {
        if (result.error.code === 'ValidationError') {
          return res.status(400).json(this.mapErrorFromResult(result));
        }
        if (result.error.code === 'NotFoundError') {
          return res.status(404).json(this.mapErrorFromResult(result));
        }
        if (result.error.code === 'ForbiddenError') {
          return res.status(403).json(this.mapErrorFromResult(result));
        }

        return res.status(500).json(this.getInternalServerError());
      }

      return res.status(201).json(result.data);
    } catch (error) {
      return res.status(500).json(this.getInternalServerError());
    }
  }

  async list(req: Request, res: Response<ServiceDTO[] | ErrorResponse>) {
    try {
      const paramsValidation = this.establishmentParamsSchema.safeParse(req.params);
      if (!paramsValidation.success) {
        return res.status(400).json(this.mapZodValidationError(paramsValidation.error));
      }
      const { establishmentCode } = paramsValidation.data;

      const result = await this.listServices.execute({ establishmentCode });

      if (!result.isOk) {
        return res.status(500).json(this.getInternalServerError());
      }

      return res.status(200).json(result.data);
    } catch (error) {
      return res.status(500).json(this.getInternalServerError());
    }
  }

  async find(req: Request, res: Response<ServiceDTO | ErrorResponse>) {
    try {
      const paramsValidation = this.serviceParamsSchema.safeParse(req.params);
      if (!paramsValidation.success) {
        return res.status(400).json(this.mapZodValidationError(paramsValidation.error));
      }
      const { code, establishmentCode } = paramsValidation.data;

      const result = await this.findService.execute({ code, establishmentCode });

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

  async update(req: AuthenticatedRequest, res: Response<ServiceDTO | ErrorResponse>) {
    try {
      const validation = this.updateServiceSchema.safeParse({ ...req.params, ...req.body });
      if (!validation.success) {
        return res.status(400).json(this.mapZodValidationError(validation.error));
      }

      const { code, establishmentCode, name, description, duration } = validation.data;

      const result = await this.updateService.execute({
        code,
        establishmentCode,
        name,
        description,
        duration,
        userId: req.user.userId,
      });

      if (!result.isOk) {
        if (result.error.code === 'ValidationError') {
          return res.status(400).json(this.mapErrorFromResult(result));
        }
        if (result.error.code === 'NotFoundError') {
          return res.status(404).json(this.mapErrorFromResult(result));
        }
        if (result.error.code === 'ForbiddenError') {
          return res.status(403).json(this.mapErrorFromResult(result));
        }

        return res.status(500).json(this.getInternalServerError());
      }

      return res.status(200).json(result.data);
    } catch (error) {
      return res.status(500).json(this.getInternalServerError());
    }
  }

  async delete(req: AuthenticatedRequest, res: Response<ErrorResponse | void>) {
    try {
      const paramsValidation = this.serviceParamsSchema.safeParse(req.params);
      if (!paramsValidation.success) {
        return res.status(400).json(this.mapZodValidationError(paramsValidation.error));
      }
      const { code, establishmentCode } = paramsValidation.data;

      const result = await this.deleteService.execute({
        code,
        establishmentCode,
        userId: req.user.userId,
      });

      if (!result.isOk) {
        if (result.error.code === 'NotFoundError') {
          return res.status(404).json(this.mapErrorFromResult(result));
        }
        if (result.error.code === 'ConflictError') {
          return res.status(409).json(this.mapErrorFromResult(result));
        }
        if (result.error.code === 'ForbiddenError') {
          return res.status(403).json(this.mapErrorFromResult(result));
        }

        return res.status(500).json(this.getInternalServerError());
      }

      return res.status(204).send();
    } catch (error) {
      return res.status(500).json(this.getInternalServerError());
    }
  }
}

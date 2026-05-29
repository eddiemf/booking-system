import type { ServiceDTO, ServiceOfferingDTO } from '@app/dtos';
import type {
  CreateService,
  CreateServiceOffering,
  DeleteService,
  DeleteServiceOffering,
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

  private readonly createServiceOfferingSchema = z.object({
    establishmentCode: z.string().min(1),
    code: z.string().min(1),
    resourceCode: z.string().min(1),
    maxCapacity: z.coerce.number().int().positive().optional(),
    duration: z.coerce.number().int().positive(),
    slotInterval: z.coerce.number().int().positive(),
    price: z.coerce.number().int().min(0).optional(),
  });

  private readonly deleteServiceOfferingSchema = z.object({
    establishmentCode: z.string().min(1),
    code: z.string().min(1),
    resourceCode: z.string().min(1),
  });

  constructor(
    private readonly createService: CreateService,
    private readonly listServices: ListServices,
    private readonly findService: FindService,
    private readonly updateService: UpdateService,
    private readonly deleteService: DeleteService,
    private readonly createServiceOffering: CreateServiceOffering,
    private readonly deleteServiceOffering: DeleteServiceOffering
  ) {
    super();
  }

  async create(req: AuthenticatedRequest, res: Response<ServiceDTO | ErrorResponse>) {
    try {
      const validation = this.createServiceSchema.safeParse({ ...req.params, ...req.body });
      if (!validation.success) {
        return this.sendZodError(res, validation.error);
      }

      const { establishmentCode, name, description, duration } = validation.data;

      const result = await this.createService.execute({
        name,
        description,
        duration,
        establishmentCode,
        userId: req.user.userId,
      });

      if (!result.isOk) return this.sendError(res, result);

      return res.status(201).json(result.data);
    } catch (error) {
      return this.sendError(res);
    }
  }

  async list(req: Request, res: Response<ServiceDTO[] | ErrorResponse>) {
    try {
      const paramsValidation = this.establishmentParamsSchema.safeParse(req.params);
      if (!paramsValidation.success) {
        return this.sendZodError(res, paramsValidation.error);
      }
      const { establishmentCode } = paramsValidation.data;

      const result = await this.listServices.execute({ establishmentCode });

      if (!result.isOk) return this.sendError(res, result);

      return res.status(200).json(result.data);
    } catch (error) {
      return this.sendError(res);
    }
  }

  async find(req: Request, res: Response<ServiceDTO | ErrorResponse>) {
    try {
      const paramsValidation = this.serviceParamsSchema.safeParse(req.params);
      if (!paramsValidation.success) {
        return this.sendZodError(res, paramsValidation.error);
      }
      const { code, establishmentCode } = paramsValidation.data;

      const result = await this.findService.execute({ code, establishmentCode });

      if (!result.isOk) return this.sendError(res, result);

      return res.status(200).json(result.data);
    } catch (error) {
      return this.sendError(res);
    }
  }

  async update(req: AuthenticatedRequest, res: Response<ServiceDTO | ErrorResponse>) {
    try {
      const validation = this.updateServiceSchema.safeParse({ ...req.params, ...req.body });
      if (!validation.success) {
        return this.sendZodError(res, validation.error);
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

      if (!result.isOk) return this.sendError(res, result);

      return res.status(200).json(result.data);
    } catch (error) {
      return this.sendError(res);
    }
  }

  async createOffering(
    req: AuthenticatedRequest,
    res: Response<ServiceOfferingDTO | ErrorResponse>
  ) {
    try {
      const validation = this.createServiceOfferingSchema.safeParse({ ...req.params, ...req.body });
      if (!validation.success) {
        return this.sendZodError(res, validation.error);
      }

      const { establishmentCode, code, resourceCode, maxCapacity, duration, slotInterval, price } =
        validation.data;

      const result = await this.createServiceOffering.execute({
        serviceCode: code,
        resourceCode,
        establishmentCode,
        userId: req.user.userId,
        maxCapacity,
        duration,
        slotInterval,
        price,
      });

      if (!result.isOk) return this.sendError(res, result);

      return res.status(201).json(result.data);
    } catch (error) {
      return this.sendError(res);
    }
  }

  async deleteOffering(req: AuthenticatedRequest, res: Response<ErrorResponse | void>) {
    try {
      const validation = this.deleteServiceOfferingSchema.safeParse({ ...req.params, ...req.body });
      if (!validation.success) {
        return this.sendZodError(res, validation.error);
      }

      const { establishmentCode, code, resourceCode } = validation.data;

      const result = await this.deleteServiceOffering.execute({
        serviceCode: code,
        resourceCode,
        establishmentCode,
        userId: req.user.userId,
      });

      if (!result.isOk) return this.sendError(res, result);

      return res.status(204).send();
    } catch (error) {
      return this.sendError(res);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response<ErrorResponse | void>) {
    try {
      const paramsValidation = this.serviceParamsSchema.safeParse(req.params);
      if (!paramsValidation.success) {
        return this.sendZodError(res, paramsValidation.error);
      }
      const { code, establishmentCode } = paramsValidation.data;

      const result = await this.deleteService.execute({
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

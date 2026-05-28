import type { EstablishmentDTO } from '@app/dtos';
import type {
  CreateEstablishment,
  DeleteEstablishment,
  FindEstablishment,
  UpdateEstablishment,
} from '@app/use-cases';
import type { Request, Response } from 'express';
import z from 'zod';
import type { AuthenticatedRequest } from '../../middleware/auth-middleware';
import { Controller, type ErrorResponse } from '../controller';

export class EstablishmentController extends Controller {
  private readonly establishmentSchema = z.object({
    name: z.string(),
  });

  private readonly codeParamsSchema = z.object({ code: z.string().min(1) });

  private readonly updateEstablishmentSchema = z.object({
    code: z.string().min(1),
    name: z.string(),
  });

  constructor(
    private readonly createEstablishment: CreateEstablishment,
    private readonly findEstablishment: FindEstablishment,
    private readonly updateEstablishment: UpdateEstablishment,
    private readonly deleteEstablishment: DeleteEstablishment
  ) {
    super();
  }

  async create(req: AuthenticatedRequest, res: Response<EstablishmentDTO | ErrorResponse>) {
    try {
      const validation = this.establishmentSchema.safeParse(req.body);
      if (!validation.success) {
        return this.sendZodError(res, validation.error);
      }

      const { name } = validation.data;

      const result = await this.createEstablishment.execute({ name, userId: req.user.userId });

      if (!result.isOk) return this.sendError(res, result);

      return res.status(201).json(result.data);
    } catch (error) {
      return this.sendError(res);
    }
  }

  async find(req: Request, res: Response<EstablishmentDTO | ErrorResponse>) {
    try {
      const paramsValidation = this.codeParamsSchema.safeParse(req.params);
      if (!paramsValidation.success) {
        return this.sendZodError(res, paramsValidation.error);
      }
      const { code } = paramsValidation.data;

      const result = await this.findEstablishment.execute({ code });

      if (!result.isOk) return this.sendError(res, result);

      return res.status(200).json(result.data);
    } catch (error) {
      return this.sendError(res);
    }
  }

  async update(req: AuthenticatedRequest, res: Response<EstablishmentDTO | ErrorResponse>) {
    try {
      const validation = this.updateEstablishmentSchema.safeParse({ ...req.params, ...req.body });
      if (!validation.success) {
        return this.sendZodError(res, validation.error);
      }

      const { code, name } = validation.data;

      const result = await this.updateEstablishment.execute({
        code,
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
      const paramsValidation = this.codeParamsSchema.safeParse(req.params);
      if (!paramsValidation.success) {
        return this.sendZodError(res, paramsValidation.error);
      }
      const { code } = paramsValidation.data;

      const result = await this.deleteEstablishment.execute({
        code,
        userId: req.user.userId,
      });

      if (!result.isOk) return this.sendError(res, result);

      return res.status(204).send();
    } catch (error) {
      return this.sendError(res);
    }
  }
}

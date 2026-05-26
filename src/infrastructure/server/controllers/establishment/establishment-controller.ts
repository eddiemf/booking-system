import type { EstablishmentDTO } from '@app/dtos';
import type {
  CreateEstablishment,
  DeleteEstablishment,
  FindEstablishment,
  UpdateEstablishment,
} from '@app/use-cases';
import type { Request, Response } from 'express';
import z from 'zod';
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

  async create(req: Request, res: Response<EstablishmentDTO | ErrorResponse>) {
    try {
      const validation = this.establishmentSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json(this.mapZodValidationError(validation.error));
      }

      const { name } = validation.data;

      const result = await this.createEstablishment.execute({ name });

      if (!result.isOk) {
        if (result.error.code === 'ValidationError') {
          return res.status(400).json(this.mapErrorFromResult(result));
        }

        return res.status(500).json(this.getInternalServerError());
      }

      return res.status(201).json(result.data);
    } catch (error) {
      return res.status(500).json(this.getInternalServerError());
    }
  }

  async find(req: Request, res: Response<EstablishmentDTO | ErrorResponse>) {
    try {
      const paramsValidation = this.codeParamsSchema.safeParse(req.params);
      if (!paramsValidation.success) {
        return res.status(400).json(this.mapZodValidationError(paramsValidation.error));
      }
      const { code } = paramsValidation.data;

      const result = await this.findEstablishment.execute({ code });

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

  async update(req: Request, res: Response<EstablishmentDTO | ErrorResponse>) {
    try {
      const validation = this.updateEstablishmentSchema.safeParse({ ...req.params, ...req.body });
      if (!validation.success) {
        return res.status(400).json(this.mapZodValidationError(validation.error));
      }

      const { code, name } = validation.data;

      const result = await this.updateEstablishment.execute({ code, name });

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
      const paramsValidation = this.codeParamsSchema.safeParse(req.params);
      if (!paramsValidation.success) {
        return res.status(400).json(this.mapZodValidationError(paramsValidation.error));
      }
      const { code } = paramsValidation.data;

      const result = await this.deleteEstablishment.execute({ code });

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

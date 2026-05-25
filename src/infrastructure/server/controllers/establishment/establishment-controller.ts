import type { EstablishmentDTO } from '@app/dtos';
import type { CreateEstablishment, FindEstablishment, UpdateEstablishment } from '@app/use-cases';
import type { Request, Response } from 'express';
import z from 'zod';
import { Controller, type ErrorResponse } from '../controller';

export class EstablishmentController extends Controller {
  private readonly establishmentSchema = z.object({
    name: z.string(),
  });

  constructor(
    private readonly createEstablishment: CreateEstablishment,
    private readonly findEstablishment: FindEstablishment,
    private readonly updateEstablishment: UpdateEstablishment
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

  async findById(req: Request, res: Response<EstablishmentDTO | ErrorResponse>) {
    try {
      const id = String(req.params.id);

      const result = await this.findEstablishment.execute({ id });

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
      const id = String(req.params.id);

      const validation = this.establishmentSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json(this.mapZodValidationError(validation.error));
      }

      const { name } = validation.data;

      const result = await this.updateEstablishment.execute({ id, name });

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
}

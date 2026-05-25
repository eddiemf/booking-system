import type { EstablishmentDTO } from '@app/dtos';
import type { CreateEstablishment } from '@app/use-cases';
import type { Request, Response } from 'express';
import z from 'zod';
import { Controller, type ErrorResponse } from '../controller';

export class EstablishmentController extends Controller {
  private readonly newEstablishmentSchema = z.object({
    name: z.string(),
  });

  constructor(private readonly createEstablishment: CreateEstablishment) {
    super();
  }

  async create(req: Request, res: Response<EstablishmentDTO | ErrorResponse>) {
    try {
      const validation = this.newEstablishmentSchema.safeParse(req.body);
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
}

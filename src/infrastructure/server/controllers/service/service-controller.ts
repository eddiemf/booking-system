import type { ServiceDTO } from '@app/dtos';
import type { CreateService } from '@app/use-cases';
import type { Request, Response } from 'express';
import z from 'zod';
import { Controller, type ErrorResponse } from '../controller';

export class ServiceController extends Controller {
  private readonly newServiceSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    duration: z.coerce.number(),
  });

  constructor(private readonly createService: CreateService) {
    super();
  }

  async create(req: Request, res: Response<ServiceDTO | ErrorResponse>) {
    try {
      const validation = this.newServiceSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json(this.mapZodValidationError(validation.error));
      }

      const { name, description, duration } = validation.data;

      const result = await this.createService.execute({
        name,
        description,
        duration,
      });

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

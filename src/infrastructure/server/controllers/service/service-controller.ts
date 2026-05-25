import type { ServiceDTO } from '@app/dtos';
import type { CreateService } from '@app/use-cases';
import type { Request, Response } from 'express';
import z from 'zod';
import { Controller, type ErrorResponse } from '../controller';

export class ServiceController extends Controller {
  private readonly newServiceSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    duration: z.number({ coerce: true }),
  });

  constructor(private readonly createServiceUseCase: CreateService) {
    super();
  }

  async createService(req: Request, res: Response): Promise<Response<ServiceDTO | ErrorResponse>> {
    try {
      const validation = this.newServiceSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json(this.mapZodValidationError(validation.error));
      }

      const { name, description, duration } = validation.data;

      const result = await this.createServiceUseCase.execute({
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

import type { AvailabilitySlotDTO } from '@app/dtos';
import type { GetAvailability } from '@app/use-cases';
import type { Request, Response } from 'express';
import z from 'zod';
import { Controller, type ErrorResponse } from '../controller';

export class AvailabilityController extends Controller {
  private readonly availabilitySchema = z.object({
    serviceCode: z.string().min(1),
    establishmentCode: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  });

  constructor(private readonly getAvailability: GetAvailability) {
    super();
  }

  async getSlots(req: Request, res: Response<AvailabilitySlotDTO[] | ErrorResponse>) {
    try {
      const validation = this.availabilitySchema.safeParse({ ...req.params, ...req.query });
      if (!validation.success) {
        return res.status(400).json(this.mapZodValidationError(validation.error));
      }

      const { serviceCode, establishmentCode, date } = validation.data;

      const result = await this.getAvailability.execute({ serviceCode, establishmentCode, date });

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
    } catch {
      return res.status(500).json(this.getInternalServerError());
    }
  }
}

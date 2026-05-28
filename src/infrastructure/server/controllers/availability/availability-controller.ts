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
        return this.sendZodError(res, validation.error);
      }

      const { serviceCode, establishmentCode, date } = validation.data;

      const result = await this.getAvailability.execute({ serviceCode, establishmentCode, date });

      if (!result.isOk) return this.sendError(res, result);

      return res.status(200).json(result.data);
    } catch {
      return this.sendError(res);
    }
  }
}

import type { ScheduleDTO } from '@app/dtos';
import type { SetSchedule } from '@app/use-cases';
import type { Request, Response } from 'express';
import z from 'zod';
import { Controller, type ErrorResponse } from '../controller';

export class ScheduleController extends Controller {
  private readonly scheduleBodySchema = z.object({
    entries: z.array(
      z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        startTime: z.string(),
        endTime: z.string(),
      })
    ),
  });

  constructor(private readonly setSchedule: SetSchedule) {
    super();
  }

  async set(req: Request, res: Response<ScheduleDTO[] | ErrorResponse>) {
    try {
      const validation = this.scheduleBodySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json(this.mapZodValidationError(validation.error));
      }

      const resourceId = String(req.params.resourceId);
      const { entries } = validation.data;

      const result = await this.setSchedule.execute({ resourceId, entries });

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

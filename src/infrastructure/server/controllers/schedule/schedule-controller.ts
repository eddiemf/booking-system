import type { ScheduleDTO } from '@app/dtos';
import type { SetSchedule } from '@app/use-cases';
import type { Response } from 'express';
import z from 'zod';
import type { AuthenticatedRequest } from '../../middleware/auth-middleware';
import { Controller, type ErrorResponse } from '../controller';

export class ScheduleController extends Controller {
  private readonly setScheduleSchema = z.object({
    establishmentCode: z.string().min(1),
    resourceCode: z.string().min(1),
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

  async set(req: AuthenticatedRequest, res: Response<ScheduleDTO[] | ErrorResponse>) {
    try {
      const validation = this.setScheduleSchema.safeParse({ ...req.params, ...req.body });
      if (!validation.success) {
        return res.status(400).json(this.mapZodValidationError(validation.error));
      }

      const { resourceCode, establishmentCode, entries } = validation.data;

      const result = await this.setSchedule.execute({
        resourceCode,
        establishmentCode,
        entries,
        userId: req.user.userId,
      });

      if (!result.isOk) {
        if (result.error.code === 'ValidationError') {
          return res.status(400).json(this.mapErrorFromResult(result));
        }
        if (result.error.code === 'NotFoundError') {
          return res.status(404).json(this.mapErrorFromResult(result));
        }
        if (result.error.code === 'ForbiddenError') {
          return res.status(403).json(this.mapErrorFromResult(result));
        }
        return res.status(500).json(this.getInternalServerError());
      }

      return res.status(200).json(result.data);
    } catch {
      return res.status(500).json(this.getInternalServerError());
    }
  }
}

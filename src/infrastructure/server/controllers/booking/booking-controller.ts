import type { BookingDTO } from '@app/dtos';
import type { CancelBooking, CreateBooking, GetBooking, ListBookings } from '@app/use-cases';
import type { Response } from 'express';
import z from 'zod';
import type { AuthenticatedRequest } from '../../middleware/auth-middleware';
import { Controller, type ErrorResponse } from '../controller';

export class BookingController extends Controller {
  private readonly createBookingSchema = z.object({
    serviceCode: z.string().min(1),
    resourceCode: z.string().min(1),
    establishmentCode: z.string().min(1),
    startsAt: z.string().min(1),
  });

  private readonly codeParamsSchema = z.object({ code: z.string().min(1) });

  private readonly listBookingsSchema = z.object({
    establishmentCode: z.string().optional(),
  });

  constructor(
    private readonly createBooking: CreateBooking,
    private readonly getBooking: GetBooking,
    private readonly listBookings: ListBookings,
    private readonly cancelBooking: CancelBooking
  ) {
    super();
  }

  async create(req: AuthenticatedRequest, res: Response<BookingDTO | ErrorResponse>) {
    try {
      const validation = this.createBookingSchema.safeParse({ ...req.params, ...req.body });
      if (!validation.success) {
        return this.sendZodError(res, validation.error);
      }

      const { serviceCode, resourceCode, establishmentCode, startsAt } = validation.data;

      const result = await this.createBooking.execute({
        serviceCode,
        resourceCode,
        establishmentCode,
        startsAt,
        userId: req.user.userId,
        userCode: req.user.userCode,
        userName: req.user.email,
      });

      if (!result.isOk) return this.sendError(res, result);

      return res.status(201).json(result.data);
    } catch {
      return this.sendError(res);
    }
  }

  async get(req: AuthenticatedRequest, res: Response<BookingDTO | ErrorResponse>) {
    try {
      const paramsValidation = this.codeParamsSchema.safeParse(req.params);
      if (!paramsValidation.success) {
        return this.sendZodError(res, paramsValidation.error);
      }

      const { code } = paramsValidation.data;

      const result = await this.getBooking.execute({ code, userId: req.user.userId });

      if (!result.isOk) return this.sendError(res, result);

      return res.status(200).json(result.data);
    } catch {
      return this.sendError(res);
    }
  }

  async list(req: AuthenticatedRequest, res: Response<BookingDTO[] | ErrorResponse>) {
    try {
      const validation = this.listBookingsSchema.safeParse({ ...req.params, ...req.query });
      if (!validation.success) {
        return this.sendZodError(res, validation.error);
      }

      const { establishmentCode } = validation.data;

      const result = await this.listBookings.execute({
        establishmentCode,
        userId: req.user.userId,
      });

      if (!result.isOk) return this.sendError(res, result);

      return res.status(200).json(result.data);
    } catch {
      return this.sendError(res);
    }
  }

  async cancel(req: AuthenticatedRequest, res: Response<BookingDTO | ErrorResponse>) {
    try {
      const paramsValidation = this.codeParamsSchema.safeParse(req.params);
      if (!paramsValidation.success) {
        return this.sendZodError(res, paramsValidation.error);
      }

      const { code } = paramsValidation.data;

      const result = await this.cancelBooking.execute({ code, userId: req.user.userId });

      if (!result.isOk) return this.sendError(res, result);

      return res.status(200).json(result.data);
    } catch {
      return this.sendError(res);
    }
  }
}

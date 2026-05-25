import type { ServiceDTO } from '@app/dtos';
import type {
  CreateService,
  DeleteService,
  FindService,
  ListServices,
  UpdateService,
} from '@app/use-cases';
import type { Request, Response } from 'express';
import z from 'zod';
import { Controller, type ErrorResponse } from '../controller';

export class ServiceController extends Controller {
  private readonly serviceSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    duration: z.coerce.number(),
  });

  constructor(
    private readonly createService: CreateService,
    private readonly listServices: ListServices,
    private readonly findService: FindService,
    private readonly updateService: UpdateService,
    private readonly deleteService: DeleteService
  ) {
    super();
  }

  async create(req: Request, res: Response<ServiceDTO | ErrorResponse>) {
    try {
      const validation = this.serviceSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json(this.mapZodValidationError(validation.error));
      }

      const { name, description, duration } = validation.data;
      const establishmentId = String(req.params.establishmentId);

      const result = await this.createService.execute({
        name,
        description,
        duration,
        establishmentId,
      });

      if (!result.isOk) {
        if (result.error.code === 'ValidationError') {
          return res.status(400).json(this.mapErrorFromResult(result));
        }
        if (result.error.code === 'NotFoundError') {
          return res.status(404).json(this.mapErrorFromResult(result));
        }

        return res.status(500).json(this.getInternalServerError());
      }

      return res.status(201).json(result.data);
    } catch (error) {
      return res.status(500).json(this.getInternalServerError());
    }
  }

  async list(req: Request, res: Response<ServiceDTO[] | ErrorResponse>) {
    try {
      const establishmentId = String(req.params.establishmentId);

      const result = await this.listServices.execute({ establishmentId });

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

  async findById(req: Request, res: Response<ServiceDTO | ErrorResponse>) {
    try {
      const id = String(req.params.id);
      const establishmentId = String(req.params.establishmentId);

      const result = await this.findService.execute({ id, establishmentId });

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

  async update(req: Request, res: Response<ServiceDTO | ErrorResponse>) {
    try {
      const validation = this.serviceSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json(this.mapZodValidationError(validation.error));
      }

      const { name, description, duration } = validation.data;
      const id = String(req.params.id);
      const establishmentId = String(req.params.establishmentId);

      const result = await this.updateService.execute({
        id,
        establishmentId,
        name,
        description,
        duration,
      });

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
      const id = String(req.params.id);
      const establishmentId = String(req.params.establishmentId);

      const result = await this.deleteService.execute({ id, establishmentId });

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

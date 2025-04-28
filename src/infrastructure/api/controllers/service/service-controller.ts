import { CreateService } from '@app/use-cases';
import { getZodErrorMap } from '@shared/get-zod-error-map';
import { Request, Response } from 'express';
import { injectable } from 'inversify';
import { match } from 'ts-pattern';
import z from 'zod';

@injectable()
export class ServiceController {
  private readonly serviceSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    duration: z.number({ coerce: true }),
  });

  constructor(private readonly createServiceUseCase: CreateService) {}

  async createService(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, duration } = req.body;

      const validation = this.serviceSchema.safeParse(
        { name, description, duration },
        { errorMap: getZodErrorMap() }
      );
      if (!validation.success) {
        res.status(400).json({ error: validation.error.issues[0].message });
        return;
      }

      const result = await this.createServiceUseCase.execute({ name, description, duration });

      if (result.isOk) {
        res.status(201).json(result.data);
        return;
      }

      const error = match(result.error.code)
        .with('ValidationError', () => ({ status: 400, message: result.error.message }))
        .with('StorageError', () => ({ status: 500, message: result.error.message }))
        .exhaustive();

      res.status(error.status).json({ error: error.message });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
}

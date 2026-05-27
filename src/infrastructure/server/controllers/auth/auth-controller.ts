import type { UserDTO } from '@app/dtos';
import type { AuthDTO } from '@app/dtos/auth-dto';
import type { GetCurrentUser, LoginWithGoogle } from '@app/use-cases';
import type { Request, Response } from 'express';
import z from 'zod';
import type { AuthenticatedRequest } from '../../middleware/auth-middleware';
import { Controller, type ErrorResponse } from '../controller';

export class AuthController extends Controller {
  private readonly googleTokenSchema = z.object({
    token: z.string().min(1),
  });

  constructor(
    private readonly loginWithGoogle: LoginWithGoogle,
    private readonly getCurrentUser: GetCurrentUser
  ) {
    super();
  }

  async googleLogin(req: Request, res: Response<AuthDTO | ErrorResponse>) {
    try {
      const validation = this.googleTokenSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json(this.mapZodValidationError(validation.error));
      }

      const result = await this.loginWithGoogle.execute({ token: validation.data.token });

      if (!result.isOk) {
        if (result.error.code === 'AuthenticationError') {
          return res.status(401).json(this.mapErrorFromResult(result));
        }
        return res.status(500).json(this.getInternalServerError());
      }

      return res.status(200).json(result.data);
    } catch {
      return res.status(500).json(this.getInternalServerError());
    }
  }

  async me(req: AuthenticatedRequest, res: Response<UserDTO | ErrorResponse>) {
    try {
      const result = await this.getCurrentUser.execute({ userId: req.user.userId });

      if (!result.isOk) {
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

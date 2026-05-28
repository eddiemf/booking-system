import type { UserDTO } from '@app/dtos';
import type { AuthDTO } from '@app/dtos/auth-dto';
import type { GetCurrentUser, LoginWithApple, LoginWithGoogle } from '@app/use-cases';
import type { Request, Response } from 'express';
import z from 'zod';
import type { AuthenticatedRequest } from '../../middleware/auth-middleware';
import { Controller, type ErrorResponse } from '../controller';

export class AuthController extends Controller {
  private readonly tokenSchema = z.object({
    token: z.string().min(1),
  });

  constructor(
    private readonly loginWithGoogle: LoginWithGoogle,
    private readonly loginWithApple: LoginWithApple,
    private readonly getCurrentUser: GetCurrentUser
  ) {
    super();
  }

  async googleLogin(req: Request, res: Response<AuthDTO | ErrorResponse>) {
    try {
      const validation = this.tokenSchema.safeParse(req.body);
      if (!validation.success) {
        return this.sendZodError(res, validation.error);
      }

      const result = await this.loginWithGoogle.execute({ token: validation.data.token });

      if (!result.isOk) return this.sendError(res, result);

      return res.status(200).json(result.data);
    } catch {
      return this.sendError(res);
    }
  }

  async appleLogin(req: Request, res: Response<AuthDTO | ErrorResponse>) {
    try {
      const validation = this.tokenSchema.safeParse(req.body);
      if (!validation.success) {
        return this.sendZodError(res, validation.error);
      }

      const result = await this.loginWithApple.execute({ token: validation.data.token });

      if (!result.isOk) return this.sendError(res, result);

      return res.status(200).json(result.data);
    } catch {
      return this.sendError(res);
    }
  }

  async me(req: AuthenticatedRequest, res: Response<UserDTO | ErrorResponse>) {
    try {
      const result = await this.getCurrentUser.execute({ userId: req.user.userId });

      if (!result.isOk) return this.sendError(res, result);

      return res.status(200).json(result.data);
    } catch {
      return this.sendError(res);
    }
  }
}

import { AuthenticationError, NotFoundError, StorageError } from '@app/domain/errors';
import type { GetCurrentUser, LoginWithApple, LoginWithGoogle } from '@app/use-cases';
import { fail, ok } from '@shared/result';
import { describe, expect, it } from 'vitest';
import { getMockReq, getMockRes } from 'vitest-mock-express';
import { mock } from 'vitest-mock-extended';
import { AuthController } from './auth-controller';

describe('AuthController', () => {
  const loginWithGoogleMock = mock<LoginWithGoogle>();
  const loginWithAppleMock = mock<LoginWithApple>();
  const getCurrentUserMock = mock<GetCurrentUser>();
  const controller = new AuthController(
    loginWithGoogleMock,
    loginWithAppleMock,
    getCurrentUserMock
  );

  describe('googleLogin()', () => {
    it('returns 400 when token is missing', async () => {
      const { res } = getMockRes();
      const req = getMockReq({ body: {} });

      // @ts-expect-error
      await controller.googleLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 401 on invalid google token', async () => {
      loginWithGoogleMock.execute.mockResolvedValue(
        fail(new AuthenticationError('Invalid or expired Google token.'))
      );
      const { res } = getMockRes();
      const req = getMockReq({ body: { token: 'bad' } });

      // @ts-expect-error
      await controller.googleLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 200 with auth DTO on success', async () => {
      const authDTO = {
        token: 'signed-jwt',
        user: { id: 'usr123', email: 'alice@example.com', name: 'Alice' },
      };
      loginWithGoogleMock.execute.mockResolvedValue(ok(authDTO));
      const { res } = getMockRes();
      const req = getMockReq({ body: { token: 'valid-google-token' } });

      // @ts-expect-error
      await controller.googleLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(authDTO);
    });

    it('returns 500 on storage error', async () => {
      loginWithGoogleMock.execute.mockResolvedValue(fail(new StorageError('DB error')));
      const { res } = getMockRes();
      const req = getMockReq({ body: { token: 'valid' } });

      // @ts-expect-error
      await controller.googleLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('returns 500 when execute throws', async () => {
      loginWithGoogleMock.execute.mockRejectedValue(new Error('Unexpected'));
      const { res } = getMockRes();
      const req = getMockReq({ body: { token: 'valid' } });

      // @ts-expect-error
      await controller.googleLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('appleLogin()', () => {
    it('returns 400 when token is missing', async () => {
      const { res } = getMockRes();
      const req = getMockReq({ body: {} });

      // @ts-expect-error
      await controller.appleLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 401 on invalid apple token', async () => {
      loginWithAppleMock.execute.mockResolvedValue(
        fail(new AuthenticationError('Invalid or expired Apple token.'))
      );
      const { res } = getMockRes();
      const req = getMockReq({ body: { token: 'bad' } });

      // @ts-expect-error
      await controller.appleLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 200 with auth DTO on success', async () => {
      const authDTO = {
        token: 'signed-jwt',
        user: { id: 'usr123', email: 'alice@example.com', name: 'Alice' },
      };
      loginWithAppleMock.execute.mockResolvedValue(ok(authDTO));
      const { res } = getMockRes();
      const req = getMockReq({ body: { token: 'valid-apple-token' } });

      // @ts-expect-error
      await controller.appleLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(authDTO);
    });

    it('returns 500 on storage error', async () => {
      loginWithAppleMock.execute.mockResolvedValue(fail(new StorageError('DB error')));
      const { res } = getMockRes();
      const req = getMockReq({ body: { token: 'valid' } });

      // @ts-expect-error
      await controller.appleLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('returns 500 when execute throws', async () => {
      loginWithAppleMock.execute.mockRejectedValue(new Error('Unexpected'));
      const { res } = getMockRes();
      const req = getMockReq({ body: { token: 'valid' } });

      // @ts-expect-error
      await controller.appleLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('me()', () => {
    it('returns 404 when user does not exist', async () => {
      getCurrentUserMock.execute.mockResolvedValue(fail(new NotFoundError('User', 'uuid-user')));
      const { res } = getMockRes();
      const req = getMockReq({
        user: { userId: 'uuid-user', userCode: 'usr123', email: 'alice@example.com' },
      });

      // @ts-expect-error
      await controller.me(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 200 with user DTO on success', async () => {
      const userDTO = { id: 'usr123', email: 'alice@example.com', name: 'Alice' };
      getCurrentUserMock.execute.mockResolvedValue(ok(userDTO));
      const { res } = getMockRes();
      const req = getMockReq({
        user: { userId: 'uuid-user', userCode: 'usr123', email: 'alice@example.com' },
      });

      // @ts-expect-error
      await controller.me(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(userDTO);
    });

    it('returns 500 on storage error', async () => {
      getCurrentUserMock.execute.mockResolvedValue(fail(new StorageError('DB error')));
      const { res } = getMockRes();
      const req = getMockReq({
        user: { userId: 'uuid-user', userCode: 'usr123', email: 'alice@example.com' },
      });

      // @ts-expect-error
      await controller.me(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('returns 500 when execute throws', async () => {
      getCurrentUserMock.execute.mockRejectedValue(new Error('Unexpected'));
      const { res } = getMockRes();
      const req = getMockReq({
        user: { userId: 'uuid-user', userCode: 'usr123', email: 'alice@example.com' },
      });

      // @ts-expect-error
      await controller.me(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});

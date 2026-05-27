export interface JwtPayload {
  userId: string;
  userCode: string;
  email: string;
}

export interface JwtPort {
  sign(payload: JwtPayload): string;
}

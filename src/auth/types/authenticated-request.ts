import type { Request } from 'express';

export type UserRole = 'ADMINISTRADOR' | 'CAJERO' | 'CLIENTE';

export interface AuthenticatedUser {
  id: number;
  email: string;
  role: UserRole;
}

export type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

export interface AccessTokenPayload {
  sub: number;
  email: string;
  role: UserRole;
}

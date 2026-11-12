/** Sesión y acceso de escritura, sin saber quién lo implementa. */

import type { Result } from '../domain';
import type { RepoError } from './errors';
import type { Unsubscribe } from './realtime';

export interface Session {
  readonly userId: string;
  readonly email: string | null;
  /** Estar autenticado no basta: hace falta estar en la allowlist. */
  readonly canWrite: boolean;
}

export interface AuthPort {
  getSession(): Promise<Session | null>;
  onChange(listener: (session: Session | null) => void): Unsubscribe;
  signInWithMagicLink(email: string, redirectTo: string): Promise<Result<void, RepoError>>;
  signOut(): Promise<void>;
}

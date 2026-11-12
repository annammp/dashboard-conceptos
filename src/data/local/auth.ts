/**
 * Sesión de desarrollo: siempre dentro y siempre con permiso de escritura.
 * El control real de acceso vive en las políticas RLS de Supabase; aquí lo que
 * importa es que la app se pueda usar y probar sin red.
 */

import { ok, type Result } from '../../domain';
import type { AuthPort, RepoError, Session, Unsubscribe } from '../../ports';

export const LOCAL_SESSION: Session = {
  userId: 'local',
  email: 'local@dev',
  canWrite: true,
};

export const createLocalAuth = (): AuthPort => ({
  getSession: () => Promise.resolve(LOCAL_SESSION),
  onChange: (listener): Unsubscribe => {
    listener(LOCAL_SESSION);
    return () => undefined;
  },
  signInWithMagicLink: (): Promise<Result<void, RepoError>> => Promise.resolve(ok(undefined)),
  signOut: () => Promise.resolve(),
});

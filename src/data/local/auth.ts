/**
 * Sesión del driver local. El control de acceso real vive en las políticas RLS
 * de Supabase; aquí lo que importa es que la app se pueda usar y probar sin red.
 *
 * La bandera de solo lectura existe para que las pruebas end-to-end puedan
 * comprobar lo que ve alguien del equipo sin permiso de escritura. Vive en el
 * adaptador local —que es el doble de prueba— y nunca toca el de Supabase.
 */

import { ok, type Result } from '../../domain';
import type { AuthPort, RepoError, Session, Unsubscribe } from '../../ports';

export const READONLY_KEY = 'conceptos.readonly';

const isReadonly = (): boolean => {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(READONLY_KEY) === '1';
  } catch {
    return false;
  }
};

export const createLocalAuth = (): AuthPort => {
  const session: Session = {
    userId: 'local',
    email: 'local@dev',
    canWrite: !isReadonly(),
  };

  return {
    getSession: () => Promise.resolve(session),
    onChange: (listener): Unsubscribe => {
      listener(session);
      return () => undefined;
    },
    signInWithMagicLink: (): Promise<Result<void, RepoError>> => Promise.resolve(ok(undefined)),
    signOut: () => Promise.resolve(),
  };
};

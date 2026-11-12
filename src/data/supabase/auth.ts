/**
 * Sesión con magic link. Estar autenticado NO basta para escribir: hay que
 * estar en la tabla `writers`, que es lo que comprueban las políticas RLS.
 * Aquí se consulta lo mismo para que la UI esconda lo que no se puede usar,
 * en vez de dejar que el usuario descubra el rechazo al hacer clic.
 */

import { err, ok, type Result } from '../../domain';
import type { AuthPort, RepoError, Session, Unsubscribe } from '../../ports';
import type { AppSupabaseClient } from './client';

export const createSupabaseAuth = (client: AppSupabaseClient): AuthPort => {
  /**
   * `rpc` no está tipado sin los tipos generados de la base, así que la
   * respuesta entra como `unknown` y se valida aquí, que es el borde.
   */
  const puedeEscribir = async (): Promise<boolean> => {
    const respuesta: { data: unknown; error: unknown } = await client.rpc('is_writer');
    return respuesta.error === null && respuesta.data === true;
  };

  const construir = async (user: { id: string; email?: string } | null): Promise<Session | null> =>
    user === null
      ? null
      : { userId: user.id, email: user.email ?? null, canWrite: await puedeEscribir() };

  return {
    getSession: async () => {
      const { data } = await client.auth.getSession();
      return await construir(data.session?.user ?? null);
    },

    onChange: (listener): Unsubscribe => {
      const { data } = client.auth.onAuthStateChange((_event, session) => {
        void construir(session?.user ?? null).then(listener);
      });
      return () => {
        data.subscription.unsubscribe();
      };
    },

    signInWithMagicLink: async (email, redirectTo): Promise<Result<void, RepoError>> => {
      const { error } = await client.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo, shouldCreateUser: false },
      });
      return error === null
        ? ok(undefined)
        : err({ kind: 'not_authorized' as const });
    },

    signOut: async () => {
      await client.auth.signOut();
    },
  };
};

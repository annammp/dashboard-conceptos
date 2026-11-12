import { createClient } from '@supabase/supabase-js';

/**
 * PKCE, no flujo implícito. Con el implícito el magic link vuelve como
 * `#access_token=...` en el fragmento, que es justo donde guardamos la vista
 * activa: chocarían y romperían las dos cosas. Con PKCE vuelve como `?code=`.
 */
export const createSupabaseClient = (url: string, anonKey: string) =>
  createClient(url, anonKey, {
    auth: {
      flowType: 'pkce',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

/** El tipo se infiere del cliente para no pelear con sus genéricos. */
export type AppSupabaseClient = ReturnType<typeof createSupabaseClient>;

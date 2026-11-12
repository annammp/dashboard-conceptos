/**
 * Traduce los errores de Postgrest a los del dominio. El `PostgrestError`
 * nunca sale de esta carpeta: arriba todo es `Result<_, RepoError>`.
 */

import type { PostgrestError } from '@supabase/supabase-js';
import type { RepoError } from '../../ports';

/** 42501 es "insufficient privilege": casi siempre, RLS rechazó la escritura. */
const POR_CODIGO: Readonly<Record<string, RepoError>> = {
  '42501': { kind: 'not_authorized' },
  PGRST301: { kind: 'not_authorized' },
  PGRST116: { kind: 'not_found' },
  '23505': { kind: 'conflict' },
  '23503': { kind: 'invalid', detail: 'Referencia a algo que no existe.' },
  '23514': { kind: 'invalid', detail: 'Un valor está fuera de lo permitido.' },
};

export const toRepoError = (error: PostgrestError | null): RepoError => {
  if (error === null) return { kind: 'unknown', detail: 'sin detalle' };
  const conocido = POR_CODIGO[error.code];
  if (conocido !== undefined) return conocido;
  // Sin código y con mensaje de red: el proyecto gratuito pudo dormirse.
  if (error.message.toLowerCase().includes('fetch')) return { kind: 'offline' };
  return { kind: 'unknown', detail: error.message };
};

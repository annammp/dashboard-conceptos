/**
 * Lee y valida la configuración una sola vez, al arrancar. Si falta algo, se
 * ve de inmediato y no como un error raro a media sesión.
 */

export type DataDriver = 'local' | 'supabase';

export interface Env {
  readonly driver: DataDriver;
  readonly supabaseUrl: string;
  readonly supabaseAnonKey: string;
  readonly baseUrl: string;
}

const read = (key: string): string => {
  const value: unknown = import.meta.env[key];
  return typeof value === 'string' ? value.trim() : '';
};

export const readEnv = (): Env => {
  const supabaseUrl = read('VITE_SUPABASE_URL');
  const supabaseAnonKey = read('VITE_SUPABASE_ANON_KEY');
  const requested = read('VITE_DATA_DRIVER');
  // Sin credenciales no tiene sentido pedir Supabase: mejor arrancar en local
  // que fallar con una pantalla en blanco.
  const canUseSupabase = supabaseUrl !== '' && supabaseAnonKey !== '';
  const driver: DataDriver = requested === 'supabase' && canUseSupabase ? 'supabase' : 'local';
  return { driver, supabaseUrl, supabaseAnonKey, baseUrl: import.meta.env.BASE_URL };
};

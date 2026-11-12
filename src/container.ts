/**
 * Raíz de composición. El único lugar de la app que conoce los adaptadores
 * concretos: todo lo demás recibe interfaces. Cambiar de backend se hace aquí
 * y en ningún otro sitio.
 */

import { readEnv, type Env } from './config/env';
import { createLocalGateway } from './data/local/gateway';
import { createSupabaseGateway } from './data/supabase/gateway';
import { systemClock, systemIds } from './data/system';
import { createDashboard, type Dashboard } from './state/dashboardStore';
import type { DataGateway } from './ports';

/**
 * Sin credenciales de Supabase, `readEnv` ya devolvió el driver local: la app
 * arranca y se puede usar igual, guardando en el navegador. Así el despliegue
 * nunca queda en pantalla blanca por una variable que falta.
 */
const createGateway = (env: Env): DataGateway =>
  env.driver === 'supabase'
    ? createSupabaseGateway({ url: env.supabaseUrl, anonKey: env.supabaseAnonKey })
    : createLocalGateway({ ids: systemIds, clock: systemClock });

export const createApp = (): Dashboard => {
  const env = readEnv();
  return createDashboard({ gateway: createGateway(env), clock: systemClock });
};

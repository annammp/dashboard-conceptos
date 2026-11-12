/**
 * Raíz de composición. El único lugar de la app que conoce los adaptadores
 * concretos: todo lo demás recibe interfaces. Cambiar de backend se hace aquí
 * y en ningún otro sitio.
 */

import { readEnv } from './config/env';
import { createLocalGateway } from './data/local/gateway';
import { systemClock, systemIds } from './data/system';
import { createDashboard, type Dashboard } from './state/dashboardStore';
import type { DataGateway } from './ports';

const createGateway = (): DataGateway =>
  // El adaptador de Supabase se enchufa aquí cuando el proyecto esté creado.
  createLocalGateway({ ids: systemIds, clock: systemClock });

export const createApp = (): Dashboard => {
  readEnv();
  return createDashboard({ gateway: createGateway(), clock: systemClock });
};

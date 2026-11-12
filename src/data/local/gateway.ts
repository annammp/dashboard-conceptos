/**
 * Arma el gateway local. Es el driver por defecto en desarrollo y el que usan
 * las pruebas end-to-end: sin red, determinista y con el mismo contrato que
 * Supabase.
 */

import type { DataGateway } from '../../ports';
import { isLocalDb, STORAGE_KEY, type LocalDb, type LocalDbHandle } from './db';
import { createPersistence, type Persistence } from './storage';
import { seedDb } from './seed';
import { createLocalRealtime } from './realtime';
import { createLocalAuth } from './auth';
import {
  createLocalConceptoRepository,
  createLocalDailyGoalRepository,
  createLocalEditorRepository,
  createLocalSettingsRepository,
  type LocalDeps,
} from './repositories';

export interface LocalGatewayOptions extends LocalDeps {
  /** Para pruebas: una persistencia en memoria en vez de `localStorage`. */
  readonly persistence?: Persistence;
  readonly initial?: LocalDb;
}

export const createLocalGateway = (options: LocalGatewayOptions): DataGateway => {
  const persistence = options.persistence ?? createPersistence(STORAGE_KEY);
  const stored = persistence.read();
  // Datos viejos o corruptos caen al estado inicial en vez de romper la app.
  let current: LocalDb = options.initial ?? (isLocalDb(stored) ? stored : seedDb());
  persistence.write(current);

  const realtime = createLocalRealtime();

  const handle: LocalDbHandle = {
    get: () => current,
    set: (next) => {
      current = next;
      persistence.write(next);
    },
    emit: realtime.emit,
  };

  const deps: LocalDeps = { ids: options.ids, clock: options.clock };

  return {
    conceptos: createLocalConceptoRepository(handle, deps),
    editors: createLocalEditorRepository(handle, deps),
    settings: createLocalSettingsRepository(handle),
    dailyGoals: createLocalDailyGoalRepository(handle),
    realtime: realtime.port,
    auth: createLocalAuth(),
  };
};

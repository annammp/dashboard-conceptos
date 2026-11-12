/**
 * Estado inicial: dos editores con meta 4 (meta de equipo 8) y ningún concepto.
 *
 * A propósito sin conceptos de ejemplo: el tablero arranca limpio, la primera
 * pantalla que se ve es el estado vacío real, y las pruebas end-to-end parten
 * de un punto conocido.
 */

import { asEditorId, type Editor } from '../../domain';
import { DEFAULT_DAILY_GOAL, DEFAULT_PACK_ID } from '../../config/defaults';
import { DB_VERSION, type LocalDb } from './db';

const editor = (id: string, name: string, sortOrder: number): Editor => ({
  id: asEditorId(id),
  name,
  dailyGoal: DEFAULT_DAILY_GOAL,
  active: true,
  sortOrder,
});

export const seedDb = (): LocalDb => ({
  version: DB_VERSION,
  editors: [editor('editor-1', 'Editor 1', 0), editor('editor-2', 'Editor 2', 1)],
  conceptos: [],
  dailyGoals: [],
  settings: { teamGoalOverride: null, encouragementPackId: DEFAULT_PACK_ID },
});

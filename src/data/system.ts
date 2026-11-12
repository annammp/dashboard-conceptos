/** Implementaciones reales del reloj y del generador de ids. Se inyectan. */

import { asInstant } from '../domain';
import type { Clock, IdFactory } from '../ports';

export const systemClock: Clock = {
  now: () => new Date(),
  nowInstant: () => asInstant(new Date().toISOString()),
};

export const systemIds: IdFactory = {
  newId: () =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `id-${String(Date.now())}-${Math.random().toString(36).slice(2, 10)}`,
};

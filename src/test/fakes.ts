/** Reloj e ids falsos: sin ellos las pruebas dependerían del momento en que corren. */

import { asInstant } from '../domain';
import type { Clock, IdFactory } from '../ports';
import type { Persistence } from '../data/local/storage';

export const createFakeClock = (start = '2026-11-12T15:00:00.000Z') => {
  let current = new Date(start);
  return {
    clock: {
      now: () => new Date(current),
      nowInstant: () => asInstant(current.toISOString()),
    } satisfies Clock,
    advanceMinutes: (minutes: number): void => {
      current = new Date(current.getTime() + minutes * 60_000);
    },
    set: (iso: string): void => {
      current = new Date(iso);
    },
  };
};

export const createFakeIds = (prefix = 'id'): IdFactory => {
  let counter = 0;
  return {
    newId: () => {
      counter += 1;
      return `${prefix}-${String(counter).padStart(4, '0')}`;
    },
  };
};

export const createMemoryPersistence = (): Persistence => {
  let held: unknown = null;
  return {
    read: () => held,
    write: (value) => {
      held = value;
    },
  };
};

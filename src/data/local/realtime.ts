/**
 * Tiempo real del adaptador local: un emisor en memoria para esta pestaña y un
 * puente por el evento `storage` para las demás. Así el comportamiento
 * multi-pestaña es el mismo que en producción y se puede probar sin red.
 */

import type { ChangeEvent, ConnectionStatus, RealtimePort, Unsubscribe } from '../../ports';
import { STORAGE_KEY } from './db';

export interface LocalRealtime {
  readonly port: RealtimePort;
  /** Propiedad-función, no método: así se puede pasar suelta sin perder `this`. */
  readonly emit: (event: ChangeEvent) => void;
}

export const createLocalRealtime = (): LocalRealtime => {
  const listeners = new Set<(event: ChangeEvent) => void>();

  const emit = (event: ChangeEvent): void => {
    for (const listener of listeners) listener(event);
  };

  const port: RealtimePort = {
    subscribe: (onChange, onStatus): Unsubscribe => {
      listeners.add(onChange);
      const status: ConnectionStatus = 'open';
      onStatus?.(status);

      const onStorage = (event: StorageEvent): void => {
        if (event.key === STORAGE_KEY) onChange({ entity: 'all', op: 'invalidate' });
      };
      if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);

      return () => {
        listeners.delete(onChange);
        if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
      };
    },
  };

  return { port, emit };
};

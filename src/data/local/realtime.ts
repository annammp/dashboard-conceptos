/**
 * Emisor en memoria del adaptador local. El puente entre pestañas vive en el
 * gateway, que es quien puede volver a leer el almacenamiento: avisar de un
 * cambio sin releerlo haría que la otra pestaña recargara su propia copia
 * vieja y no se enterara de nada.
 */

import type { ChangeEvent, ConnectionStatus, RealtimePort, Unsubscribe } from '../../ports';

export interface LocalRealtime {
  readonly port: RealtimePort;
  /** Propiedad-función, no método: se pasa suelta sin perder `this`. */
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
      return () => {
        listeners.delete(onChange);
      };
    },
  };

  return { port, emit };
};

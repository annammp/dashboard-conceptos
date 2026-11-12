/**
 * Un store observable mínimo. No usamos Redux ni Zustand porque hay una sola
 * porción de estado compartido y porque los cambios llegan **desde fuera de
 * React** (websocket, evento `storage`, cambios de sesión): para eso la API
 * correcta es `useSyncExternalStore`, que además es a prueba de *tearing* en
 * render concurrente. Son cuarenta líneas y se prueban sin montar React.
 */

// Propiedades-función, no métodos: `subscribe` se pasa suelta a
// `useSyncExternalStore`, y así no puede perder su `this`.
export interface Store<S> {
  readonly get: () => S;
  /** Si el actualizador devuelve el mismo objeto, no se notifica a nadie. */
  readonly set: (update: (state: S) => S) => void;
  readonly subscribe: (listener: () => void) => () => void;
}

export const createStore = <S>(initial: S): Store<S> => {
  let state = initial;
  const listeners = new Set<() => void>();

  return {
    get: () => state,
    set: (update) => {
      const next = update(state);
      if (Object.is(next, state)) return;
      state = next;
      for (const listener of listeners) listener();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
};

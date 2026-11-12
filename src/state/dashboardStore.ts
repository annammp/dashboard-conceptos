/**
 * Une el store, las acciones y el mundo exterior: carga inicial, tiempo real,
 * sesión y el polling de respaldo cuando se cae el websocket.
 */

import { todayIso } from '../domain';
import { POLL_INTERVAL_MS } from '../config/defaults';
import type { Clock, DataGateway } from '../ports';
import { createStore, type Store } from './store';
import { applyChange } from './changes';
import { initialState, loadRange, rangeFor } from './load';
import { createActions, type Actions } from './actions';
import type { DashboardState } from './types';

export interface Dashboard {
  readonly store: Store<DashboardState>;
  readonly actions: Actions;
  readonly start: () => Promise<void>;
  readonly dispose: () => void;
}

export interface DashboardDeps {
  readonly gateway: DataGateway;
  readonly clock: Clock;
}

export const createDashboard = (deps: DashboardDeps): Dashboard => {
  const store = createStore(initialState(deps.clock));
  const teardown: Array<() => void> = [];

  const reload = async (): Promise<void> => {
    const state = store.get();
    const range = rangeFor(state.selectedDate, todayIso(deps.clock.now()));
    const result = await loadRange(deps.gateway, range);
    if (!result.ok) {
      store.set((current) => ({ ...current, status: 'error', error: result.error }));
      return;
    }
    store.set((current) => ({ ...current, ...result.data, range, status: 'ready', error: null }));
  };

  const actions = createActions({ store, gateway: deps.gateway, reload });

  const watchRealtime = (): void => {
    teardown.push(
      deps.gateway.realtime.subscribe(
        (event) => {
          if (event.entity === 'all') {
            void reload();
            return;
          }
          store.set((state) => applyChange(state, event));
        },
        (status) => {
          store.set((state) => ({ ...state, live: status === 'open' }));
        },
      ),
    );
  };

  const watchSession = (): void => {
    teardown.push(
      deps.gateway.auth.onChange((session) => {
        store.set((state) => ({ ...state, session }));
      }),
    );
  };

  /**
   * Respaldo: si el tiempo real se cae —o el proyecto gratuito se durmió— se
   * refresca por polling y al volver el foco a la pestaña, en vez de mostrar
   * datos viejos sin avisar.
   */
  const watchStaleness = (): void => {
    const timer = setInterval(() => {
      if (!store.get().live) void reload();
    }, POLL_INTERVAL_MS);
    teardown.push(() => {
      clearInterval(timer);
    });

    if (typeof document === 'undefined') return;
    const onVisible = (): void => {
      if (document.visibilityState === 'visible') void reload();
    };
    document.addEventListener('visibilitychange', onVisible);
    teardown.push(() => {
      document.removeEventListener('visibilitychange', onVisible);
    });
  };

  return {
    store,
    actions,
    start: async () => {
      watchSession();
      watchRealtime();
      watchStaleness();
      await reload();
    },
    dispose: () => {
      for (const off of teardown) off();
      teardown.length = 0;
    },
  };
};

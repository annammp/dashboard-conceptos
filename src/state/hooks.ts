/**
 * El puente con React. `useSyncExternalStore` con un selector: un cambio solo
 * re-renderiza los componentes cuyo valor seleccionado cambió de verdad.
 */

import { useCallback, useContext, useSyncExternalStore } from 'react';
import { DashboardContext } from './StoreProvider';
import type { Actions } from './actions';
import type { DashboardState } from './types';

const useDashboard = () => {
  const dashboard = useContext(DashboardContext);
  if (dashboard === null) throw new Error('Falta <StoreProvider> arriba en el árbol.');
  return dashboard;
};

export const useActions = (): Actions => useDashboard().actions;

export function useStore<T>(select: (state: DashboardState) => T): T {
  const { store } = useDashboard();
  const snapshot = useCallback(() => select(store.get()), [store, select]);
  return useSyncExternalStore(store.subscribe, snapshot, snapshot);
}

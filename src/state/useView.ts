/**
 * Las vistas van en el hash de la URL: sin router, sin truco de `404.html` en
 * GitHub Pages, y los enlaces directos siguen funcionando.
 */

import { useCallback, useSyncExternalStore } from 'react';

export const VIEWS = ['hoy', 'historial', 'ajustes'] as const;
export type View = (typeof VIEWS)[number];

const isView = (value: string): value is View => VIEWS.some((view) => view === value);

const currentView = (): View => {
  const raw = window.location.hash.replace(/^#\/?/, '');
  return isView(raw) ? raw : 'hoy';
};

const subscribe = (listener: () => void): (() => void) => {
  window.addEventListener('hashchange', listener);
  return () => {
    window.removeEventListener('hashchange', listener);
  };
};

export const useView = (): { view: View; setView: (view: View) => void } => {
  const view = useSyncExternalStore(subscribe, currentView, (): View => 'hoy');
  const setView = useCallback((next: View) => {
    window.location.hash = `/${next}`;
  }, []);
  return { view, setView };
};

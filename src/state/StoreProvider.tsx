/**
 * El único Context de la app. Su valor no cambia de identidad nunca, así que
 * no provoca re-renders por sí mismo: quien se suscribe lo hace por selector.
 */

import { createContext, useEffect, useMemo, type ReactNode } from 'react';
import type { Dashboard } from './dashboardStore';

export const DashboardContext = createContext<Dashboard | null>(null);

interface StoreProviderProps {
  readonly dashboard: Dashboard;
  readonly children: ReactNode;
}

export const StoreProvider = ({ dashboard, children }: StoreProviderProps) => {
  useEffect(() => {
    void dashboard.start();
    return () => {
      dashboard.dispose();
    };
  }, [dashboard]);

  const value = useMemo(() => dashboard, [dashboard]);
  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
};

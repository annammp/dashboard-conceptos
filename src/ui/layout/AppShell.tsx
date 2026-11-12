import type { ReactNode } from 'react';
import { useStore } from '../../state/hooks';
import { selectCanWrite, selectLive } from '../../state/selectors';
import { TabNav } from './TabNav';
import type { View } from '../../state/useView';

interface AppShellProps {
  readonly view: View;
  readonly onViewChange: (view: View) => void;
  readonly children: ReactNode;
}

export const AppShell = ({ view, onViewChange, children }: AppShellProps) => {
  const live = useStore(selectLive);
  const canWrite = useStore(selectCanWrite);

  return (
    <div className="app">
      <header className="app__head">
        <div className="app__marca">
          <span className="app__logo" aria-hidden="true" />
          <span className="app__nombre">Conceptos</span>
        </div>
        <TabNav view={view} onChange={onViewChange} />
        <div className="app__estado">
          {live ? null : <span className="chip chip--warn">Sin conexión en vivo</span>}
          {canWrite ? null : <span className="chip">Solo lectura</span>}
        </div>
      </header>
      <main className="app__main">{children}</main>
    </div>
  );
};

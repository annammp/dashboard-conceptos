import { AppShell } from './ui/layout/AppShell';
import { LoadState } from './ui/layout/LoadState';
import { Notice } from './ui/layout/Notice';
import { DashboardView } from './ui/dashboard/DashboardView';
import { HistoryView } from './ui/history/HistoryView';
import { SettingsView } from './ui/settings/SettingsView';
import { useStore } from './state/hooks';
import { selectIsReady } from './state/selectors';
import { useView } from './state/useView';

const VIEWS = {
  hoy: DashboardView,
  historial: HistoryView,
  ajustes: SettingsView,
};

export const App = ({ onRetry }: { readonly onRetry: () => void }) => {
  const { view, setView } = useView();
  const ready = useStore(selectIsReady);
  const Current = VIEWS[view];

  return (
    <AppShell view={view} onViewChange={setView}>
      <Notice />
      <LoadState onRetry={onRetry} />
      {ready ? <Current /> : null}
    </AppShell>
  );
};

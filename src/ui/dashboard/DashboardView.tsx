import { todayIso, type IsoDate } from '../../domain';
import { useActions, useStore } from '../../state/hooks';
import { selectCanWrite, selectSelectedDate, selectSortedEditors } from '../../state/selectors';
import { ConceptoBoard } from '../conceptos/ConceptoBoard';
import { QuickAddBar } from '../conceptos/QuickAddBar';
import { DateNav } from './DateNav';
import { ProgressSection } from './ProgressSection';

interface DashboardViewProps {
  /** Se inyecta para que las pruebas puedan fijar el día. */
  readonly today?: IsoDate;
}

export const DashboardView = ({ today = todayIso(new Date()) }: DashboardViewProps) => {
  const selectedDate = useStore(selectSelectedDate);
  const editors = useStore(selectSortedEditors);
  const canWrite = useStore(selectCanWrite);
  const actions = useActions();

  const activos = editors.filter((editor) => editor.active);

  return (
    <div className="vista">
      <DateNav
        date={selectedDate}
        today={today}
        onChange={(date) => void actions.selectDate(date)}
      />
      <ProgressSection />
      {canWrite && activos.length > 0 ? (
        <QuickAddBar
          editors={activos}
          onAdd={(editorId, count) => void actions.addConceptos(editorId, count)}
        />
      ) : null}
      <ConceptoBoard />
    </div>
  );
};

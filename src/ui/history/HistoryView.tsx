import { useStore } from '../../state/hooks';
import { selectTrend } from '../../state/selectors';
import { Card } from '../primitives/Card';
import { CsvExportPanel } from '../export/CsvExportPanel';
import { TrendDataTable } from './TrendDataTable';
import { WeekTrendChart } from './WeekTrendChart';

export const HistoryView = () => {
  const points = useStore(selectTrend);

  return (
    <div className="vista">
      <Card title="Entregados por día">
        {points.length === 0 ? (
          <p className="columna__vacio">Todavía no hay días que mostrar.</p>
        ) : (
          <>
            <WeekTrendChart points={points} />
            <details className="detalle-datos">
              <summary>Ver los números</summary>
              <TrendDataTable points={points} />
            </details>
          </>
        )}
      </Card>

      <Card title="Exportar">
        <CsvExportPanel />
      </Card>
    </div>
  );
};

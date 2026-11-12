import { conceptoCsvColumns, CSV_BOM, toCsv } from '../../domain';
import { triggerDownload } from '../../lib/download';
import { useStore } from '../../state/hooks';
import { selectEditorName } from '../../state/selectors';
import { Button } from '../primitives/Button';

/** Exporta lo que está cargado en la ventana actual: lo que se ve es lo que baja. */
export const CsvExportPanel = () => {
  const conceptos = useStore((state) => state.conceptos);
  const range = useStore((state) => state.range);
  const nameOf = useStore(selectEditorName);

  const descargar = (): void => {
    const csv = toCsv(conceptos, conceptoCsvColumns(nameOf));
    // El BOM es lo que hace que Excel y Sheets lean los acentos como UTF-8.
    triggerDownload(`conceptos-${range.from}-a-${range.to}.csv`, 'text/csv;charset=utf-8', CSV_BOM + csv);
  };

  return (
    <div className="exportar">
      <p className="exportar__texto">
        {conceptos.length} conceptos entre {range.from} y {range.to}
      </p>
      <Button variant="primary" disabled={conceptos.length === 0} onClick={descargar}>
        Exportar CSV
      </Button>
    </div>
  );
};

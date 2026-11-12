import { CONCEPTO_STATUSES } from '../../domain';
import { useActions, useStore } from '../../state/hooks';
import { selectCanWrite, selectEditorName, selectVisibleConceptos } from '../../state/selectors';
import { ConceptoCard } from './ConceptoCard';
import { StatusColumn } from './StatusColumn';

/** Contenedor: lee del store y despacha. Las columnas y tarjetas son presentacionales. */
export const ConceptoBoard = () => {
  const conceptos = useStore(selectVisibleConceptos);
  const canWrite = useStore(selectCanWrite);
  const nameOf = useStore(selectEditorName);
  const actions = useActions();

  return (
    <div className="tablero">
      {CONCEPTO_STATUSES.map((status) => {
        const column = conceptos.filter((concepto) => concepto.status === status);
        return (
          <StatusColumn key={status} status={status} conceptos={column}>
            {column.map((concepto) => (
              <ConceptoCard
                key={concepto.id}
                concepto={concepto}
                editorName={nameOf(concepto.editorId)}
                canWrite={canWrite}
                onMove={(id, to) => void actions.moveConcepto(id, to)}
                onRename={(id, title) => void actions.renameConcepto(id, title)}
                onRemove={(id) => void actions.removeConcepto(id)}
              />
            ))}
          </StatusColumn>
        );
      })}
    </div>
  );
};

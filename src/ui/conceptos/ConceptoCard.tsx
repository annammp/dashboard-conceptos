import { allowedTargets, STATUS_LABELS, type Concepto, type ConceptoStatus } from '../../domain';

interface ConceptoCardProps {
  readonly concepto: Concepto;
  readonly editorName: string;
  readonly canWrite: boolean;
  readonly onMove: (id: Concepto['id'], to: ConceptoStatus) => void;
  readonly onRename: (id: Concepto['id'], title: string) => void;
  readonly onRemove: (id: Concepto['id']) => void;
}

/**
 * Los botones de mover se generan desde `allowedTargets`, que es la misma
 * tabla que valida la transición: no se pueden desincronizar.
 */
export const ConceptoCard = ({
  concepto,
  editorName,
  canWrite,
  onMove,
  onRename,
  onRemove,
}: ConceptoCardProps) => (
  <li className="concepto">
    <input
      className="concepto__title"
      value={concepto.title}
      placeholder="Sin título"
      aria-label={`Título del concepto de ${editorName}`}
      disabled={!canWrite}
      onChange={(event) => {
        onRename(concepto.id, event.target.value);
      }}
    />
    <p className="concepto__editor">{editorName}</p>

    {canWrite ? (
      <div className="concepto__acciones">
        {allowedTargets(concepto.status).map((target) => (
          <button
            key={target}
            type="button"
            className="concepto__mover"
            onClick={() => {
              onMove(concepto.id, target);
            }}
          >
            {STATUS_LABELS[target]}
          </button>
        ))}
        <button
          type="button"
          className="concepto__borrar"
          aria-label={`Eliminar concepto ${concepto.title === '' ? 'sin título' : concepto.title}`}
          onClick={() => {
            onRemove(concepto.id);
          }}
        >
          Eliminar
        </button>
      </div>
    ) : null}
  </li>
);

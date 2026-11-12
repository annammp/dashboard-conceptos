import { NumberField } from '../primitives/NumberField';

interface TeamGoalEditorProps {
  readonly derived: number;
  readonly override: number | null;
  readonly canWrite: boolean;
  readonly onChange: (override: number | null) => void;
}

/**
 * Por defecto la meta de equipo es la suma de las individuales (2 × 4 = 8).
 * Fijarla a mano es la excepción, así que va detrás de una casilla.
 */
export const TeamGoalEditor = ({ derived, override, canWrite, onChange }: TeamGoalEditorProps) => (
  <div className="meta-equipo">
    <label className="meta-equipo__check">
      <input
        type="checkbox"
        checked={override !== null}
        disabled={!canWrite}
        onChange={(event) => {
          onChange(event.target.checked ? derived : null);
        }}
      />
      <span>Fijar la meta de equipo a mano</span>
    </label>

    {override === null ? (
      <p className="meta-equipo__texto">
        Se calcula sola: <strong className="num">{derived}</strong> (la suma de las metas de los
        editores activos).
      </p>
    ) : (
      <NumberField
        label="Meta de equipo"
        value={override}
        max={1000}
        disabled={!canWrite}
        onChange={onChange}
      />
    )}
  </div>
);

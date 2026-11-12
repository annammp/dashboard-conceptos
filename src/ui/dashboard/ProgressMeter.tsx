import type { StatusTally } from '../../domain';

interface ProgressMeterProps {
  readonly tally: StatusTally;
  readonly goal: number;
  readonly label: string;
}

/**
 * Barra apilada contra la meta: de un vistazo se ve cuántos van entregados,
 * cuántos en ajustes y cuántos en progreso. El ancho total es la meta, así que
 * "lo que falta por llenar" es literalmente lo que falta.
 */
export const ProgressMeter = ({ tally, goal, label }: ProgressMeterProps) => {
  const scale = Math.max(goal, tally.total, 1);
  const segments = [
    { key: 'entregado', value: tally.entregado, name: 'entregados' },
    { key: 'ajustes', value: tally.en_ajustes, name: 'en ajustes' },
    { key: 'progreso', value: tally.en_progreso, name: 'en progreso' },
  ].filter((segment) => segment.value > 0);

  const descripcion = `${label}: ${String(tally.entregado)} de ${String(goal)} entregados`;

  return (
    <div className="meter" role="img" aria-label={descripcion}>
      <div className="meter__track">
        {segments.map((segment) => (
          <span
            key={segment.key}
            className={`meter__fill meter__fill--${segment.key}`}
            style={{ width: `${String((segment.value / scale) * 100)}%` }}
          />
        ))}
        {goal > 0 && goal < scale ? (
          <span className="meter__goal" style={{ left: `${String((goal / scale) * 100)}%` }} />
        ) : null}
      </div>
    </div>
  );
};

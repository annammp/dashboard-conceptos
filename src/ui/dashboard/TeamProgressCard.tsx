import type { ProgressStat, StatusTally } from '../../domain';
import { pluralize } from '../../lib/format';
import { ProgressMeter } from './ProgressMeter';

interface TeamProgressCardProps {
  readonly stat: ProgressStat;
  readonly tally: StatusTally;
  readonly message: string;
}

export const TeamProgressCard = ({ stat, tally, message }: TeamProgressCardProps) => (
  <article className="equipo">
    <div className="equipo__cifra">
      <p className="equipo__score num num--display">
        <strong>{stat.delivered}</strong>
        <span className="equipo__goal">/ {stat.goal}</span>
      </p>
      <p className="equipo__label">entregados hoy, entre todo el equipo</p>
    </div>

    <div className="equipo__barra">
      <ProgressMeter tally={tally} goal={stat.goal} label="Equipo" />
      <p className={`equipo__falta ${stat.met ? 'equipo__falta--ok' : ''}`}>
        {stat.met
          ? 'Meta del equipo cumplida'
          : `Faltan ${pluralize(stat.missing, 'concepto', 'conceptos')} para la meta`}
      </p>
    </div>

    <p className="equipo__aliento" aria-live="polite">
      {message}
    </p>
  </article>
);

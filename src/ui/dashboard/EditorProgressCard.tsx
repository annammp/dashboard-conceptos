import type { EditorProgress } from '../../domain';
import { pluralize } from '../../lib/format';
import { ProgressMeter } from './ProgressMeter';

interface EditorProgressCardProps {
  readonly progress: EditorProgress;
}

export const EditorProgressCard = ({ progress }: EditorProgressCardProps) => (
  <article className="progreso">
    <header className="progreso__head">
      <h3 className="progreso__name">{progress.name}</h3>
      <p className="progreso__score num num--display">
        <strong>{progress.delivered}</strong>
        <span className="progreso__goal">/ {progress.goal}</span>
      </p>
    </header>

    <ProgressMeter tally={progress.tally} goal={progress.goal} label={progress.name} />

    <p className={`progreso__falta ${progress.met ? 'progreso__falta--ok' : ''}`}>
      {progress.met
        ? '¡Meta cumplida!'
        : `Faltan ${pluralize(progress.missing, 'concepto', 'conceptos')}`}
    </p>

    <dl className="desglose">
      <div className="desglose__item">
        <dt>En progreso</dt>
        <dd className="num">{progress.tally.en_progreso}</dd>
      </div>
      <div className="desglose__item">
        <dt>En ajustes</dt>
        <dd className="num">{progress.tally.en_ajustes}</dd>
      </div>
      <div className="desglose__item">
        <dt>Entregados</dt>
        <dd className="num">{progress.tally.entregado}</dd>
      </div>
    </dl>
  </article>
);

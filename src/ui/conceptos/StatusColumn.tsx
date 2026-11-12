import { STATUS_DESCRIPTIONS, STATUS_LABELS, type Concepto, type ConceptoStatus } from '../../domain';
import type { ReactNode } from 'react';

interface StatusColumnProps {
  readonly status: ConceptoStatus;
  readonly conceptos: readonly Concepto[];
  readonly children: ReactNode;
}

/**
 * El estado se distingue por etiqueta y por una marca de forma además del
 * color: nadie debería depender solo del color para saber dónde está algo.
 */
export const StatusColumn = ({ status, conceptos, children }: StatusColumnProps) => (
  <section className={`columna columna--${status}`} aria-labelledby={`col-${status}`}>
    <header className="columna__head">
      <span className={`columna__marca columna__marca--${status}`} aria-hidden="true" />
      <h3 className="columna__title" id={`col-${status}`}>
        {STATUS_LABELS[status]}
      </h3>
      <span className="columna__count num" aria-label={`${String(conceptos.length)} conceptos`}>
        {conceptos.length}
      </span>
    </header>
    <p className="columna__hint">{STATUS_DESCRIPTIONS[status]}</p>
    {conceptos.length === 0 ? (
      <p className="columna__vacio">Nada por aquí todavía.</p>
    ) : (
      <ul className="columna__lista">{children}</ul>
    )}
  </section>
);

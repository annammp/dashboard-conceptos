/**
 * Las transiciones son una tabla, no una cadena de `if`. Un concepto no puede
 * llegar a un estado inválido porque no hay camino hacia él, y la UI dibuja los
 * botones leyendo la misma tabla: imposible que se desincronicen.
 */

import type { Concepto, ConceptoStatus, Instant } from './types';
import { err, ok, type Result } from './result';

export const STATUS_FLOW: Readonly<Record<ConceptoStatus, readonly ConceptoStatus[]>> = {
  en_progreso: ['en_ajustes', 'entregado'],
  // Desde ajustes se puede regresar a trabajo o volver a entregar.
  en_ajustes: ['en_progreso', 'entregado'],
  // Un entregado solo se reabre a ajustes: saltar directo a "en progreso"
  // borraría el hecho de que ya se había entregado una vez.
  entregado: ['en_ajustes'],
};

export const STATUS_LABELS: Readonly<Record<ConceptoStatus, string>> = {
  en_progreso: 'En progreso',
  en_ajustes: 'En ajustes',
  entregado: 'Entregado',
};

export const STATUS_DESCRIPTIONS: Readonly<Record<ConceptoStatus, string>> = {
  en_progreso: 'Se está trabajando',
  en_ajustes: 'Devuelto con correcciones',
  entregado: 'Terminado y aceptado',
};

/** Lo único que suma para la meta. */
export const countsTowardGoal = (status: ConceptoStatus): boolean => status === 'entregado';

export const allowedTargets = (from: ConceptoStatus): readonly ConceptoStatus[] => STATUS_FLOW[from];

export const canTransition = (from: ConceptoStatus, to: ConceptoStatus): boolean =>
  STATUS_FLOW[from].includes(to);

export type TransitionError =
  | { readonly kind: 'same_status'; readonly status: ConceptoStatus }
  | { readonly kind: 'illegal'; readonly from: ConceptoStatus; readonly to: ConceptoStatus };

/**
 * `deliveredAt` se mantiene coherente aquí y nada más aquí: entra al entregar,
 * se limpia al salir, y se conserva si ya existía (reentregar no reescribe la
 * primera entrega).
 */
export const transition = (
  concepto: Concepto,
  to: ConceptoStatus,
  now: Instant,
): Result<Concepto, TransitionError> => {
  if (concepto.status === to) return err({ kind: 'same_status', status: to });
  if (!canTransition(concepto.status, to)) {
    return err({ kind: 'illegal', from: concepto.status, to });
  }
  return ok({
    ...concepto,
    status: to,
    deliveredAt: to === 'entregado' ? (concepto.deliveredAt ?? now) : null,
    updatedAt: now,
  });
};

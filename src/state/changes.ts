/**
 * Cómo se funde un cambio que llegó de fuera (tiempo real, otra pestaña) con
 * el estado actual. Reductor puro, probable sin montar nada.
 *
 * Upsert por id e idempotente: que un cambio propio vuelva por el websocket no
 * hace daño, y por eso no hace falta llevar un registro de operaciones en
 * vuelo. Ante un choque, gana el `updatedAt` más reciente, que lo pone el
 * servidor y no el reloj de cada laptop.
 */

import { assertNever, type Concepto, type Editor } from '../domain';
import type { ChangeEvent } from '../ports';
import type { DashboardState } from './types';

/**
 * Idempotente por id. Lo usan tanto el tiempo real como las acciones: una
 * escritura propia y su eco por websocket convergen al mismo estado, sin
 * importar cuál llegue primero. Por eso no hace falta llevar un registro de
 * operaciones en vuelo.
 */
export const upsertConcepto = (
  conceptos: readonly Concepto[],
  row: Concepto,
): readonly Concepto[] => {
  const index = conceptos.findIndex((concepto) => concepto.id === row.id);
  if (index === -1) return [...conceptos, row];
  const existing = conceptos[index];
  if (existing !== undefined && existing.updatedAt > row.updatedAt) return conceptos;
  return conceptos.map((concepto) => (concepto.id === row.id ? row : concepto));
};

export const upsertEditor = (editors: readonly Editor[], row: Editor): readonly Editor[] =>
  editors.some((editor) => editor.id === row.id)
    ? editors.map((editor) => (editor.id === row.id ? row : editor))
    : [...editors, row];

const inRange = (state: DashboardState, row: Concepto): boolean =>
  row.date >= state.range.from && row.date <= state.range.to;

export const applyChange = (state: DashboardState, event: ChangeEvent): DashboardState => {
  switch (event.entity) {
    case 'concepto':
      if (event.op === 'delete') {
        return { ...state, conceptos: state.conceptos.filter((c) => c.id !== event.id) };
      }
      // Un concepto de un día que no tenemos cargado no nos interesa todavía.
      return inRange(state, event.row)
        ? { ...state, conceptos: upsertConcepto(state.conceptos, event.row) }
        : state;
    case 'editor':
      return event.op === 'delete'
        ? { ...state, editors: state.editors.filter((editor) => editor.id !== event.id) }
        : { ...state, editors: upsertEditor(state.editors, event.row) };
    case 'settings':
      return { ...state, settings: event.row };
    case 'all':
      // "Vuelve a leer": el store se encarga, aquí no hay nada que fundir.
      return state;
    default:
      return assertNever(event);
  }
};

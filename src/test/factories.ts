/** Constructores de datos para pruebas: explícitos en lo que importa, con defaults en lo demás. */

import {
  asConceptoId,
  asEditorId,
  asInstant,
  parseIsoDate,
  type Concepto,
  type Editor,
  type EditorId,
  type Instant,
  type IsoDate,
} from '../domain';
import { DEFAULT_DAILY_GOAL } from '../config/defaults';

export const isoDate = (raw: string): IsoDate => {
  const parsed = parseIsoDate(raw);
  if (!parsed.ok) throw new Error(`fecha de prueba inválida: ${raw}`);
  return parsed.value;
};

export const instant = (raw = '2026-11-12T15:00:00.000Z'): Instant => asInstant(raw);

export const TODAY = isoDate('2026-11-12');

let sequence = 0;
export const resetSequence = (): void => {
  sequence = 0;
};
const nextId = (prefix: string): string => {
  sequence += 1;
  return `${prefix}-${String(sequence).padStart(3, '0')}`;
};

export const makeEditor = (overrides: Partial<Editor> = {}): Editor => ({
  id: asEditorId(nextId('editor')),
  name: 'Editor de prueba',
  dailyGoal: DEFAULT_DAILY_GOAL,
  active: true,
  sortOrder: 0,
  ...overrides,
});

export const makeConcepto = (overrides: Partial<Concepto> = {}): Concepto => ({
  id: asConceptoId(nextId('concepto')),
  editorId: asEditorId('editor-001'),
  date: TODAY,
  title: 'Concepto de prueba',
  status: 'en_progreso',
  deliveredAt: null,
  createdAt: instant(),
  updatedAt: instant(),
  ...overrides,
});

/** `n` conceptos entregados de un editor en un día. Atajo para armar escenarios. */
export const makeDelivered = (count: number, editorId: EditorId, date = TODAY): Concepto[] =>
  Array.from({ length: count }, () =>
    makeConcepto({ editorId, date, status: 'entregado', deliveredAt: instant() }),
  );

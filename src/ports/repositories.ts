/**
 * Los puertos de persistencia: tres interfaces chicas en vez de un
 * `DataService` que lo sepa todo. Quien necesita leer conceptos no depende de
 * cómo se guardan los ajustes.
 */

import type {
  AppSettings,
  Concepto,
  ConceptoId,
  ConceptoStatus,
  DailyGoal,
  DateRange,
  Editor,
  EditorId,
  IsoDate,
  Result,
} from '../domain';
import type { RepoError } from './errors';

export type Fallible<T> = Promise<Result<T, RepoError>>;

export interface NewConcepto {
  readonly editorId: EditorId;
  readonly date: IsoDate;
  readonly title: string;
  readonly status?: ConceptoStatus;
}

/**
 * `deliveredAt` entra aquí porque lo calcula `transition()` en el dominio: el
 * repositorio solo persiste lo que el dominio decidió, sin duplicar la regla.
 */
export type ConceptoPatch = Partial<
  Pick<Concepto, 'title' | 'status' | 'editorId' | 'date' | 'deliveredAt'>
>;

export interface ConceptoRepository {
  listByRange(range: DateRange): Fallible<readonly Concepto[]>;
  create(input: NewConcepto): Fallible<Concepto>;
  createMany(inputs: readonly NewConcepto[]): Fallible<readonly Concepto[]>;
  update(id: ConceptoId, patch: ConceptoPatch): Fallible<Concepto>;
  remove(id: ConceptoId): Fallible<void>;
}

export interface NewEditor {
  readonly name: string;
  readonly dailyGoal: number;
}

export interface EditorRepository {
  list(): Fallible<readonly Editor[]>;
  create(input: NewEditor): Fallible<Editor>;
  update(id: EditorId, patch: Partial<Omit<Editor, 'id'>>): Fallible<Editor>;
}

export interface SettingsRepository {
  get(): Fallible<AppSettings>;
  update(patch: Partial<AppSettings>): Fallible<AppSettings>;
}

/** Las metas congeladas por día. Se escriben al tocar un día por primera vez. */
export interface DailyGoalRepository {
  listByRange(range: DateRange): Fallible<readonly DailyGoal[]>;
  snapshot(entries: readonly DailyGoal[]): Fallible<readonly DailyGoal[]>;
}

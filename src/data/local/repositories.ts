/**
 * Los cuatro repositorios sobre la base local. Cada operación: leer, calcular
 * el nuevo estado, persistir y emitir el cambio. Sin lógica de negocio: eso
 * vive en el dominio.
 */

import {
  asConceptoId,
  asEditorId,
  compareIso,
  type Concepto,
  type ConceptoId,
  type DailyGoal,
  type Editor,
  type EditorId,
  err,
  goalKey,
  ok,
} from '../../domain';
import type {
  Clock,
  ConceptoPatch,
  ConceptoRepository,
  DailyGoalRepository,
  EditorRepository,
  IdFactory,
  NewConcepto,
  SettingsRepository,
} from '../../ports';
import type { LocalDbHandle } from './db';

export interface LocalDeps {
  readonly ids: IdFactory;
  readonly clock: Clock;
}

const inRange = (date: string, from: string, to: string): boolean =>
  date >= from && date <= to;

export const createLocalConceptoRepository = (
  db: LocalDbHandle,
  deps: LocalDeps,
): ConceptoRepository => {
  const build = (input: NewConcepto): Concepto => {
    const now = deps.clock.nowInstant();
    return {
      id: asConceptoId(deps.ids.newId()),
      editorId: input.editorId,
      date: input.date,
      title: input.title,
      status: input.status ?? 'en_progreso',
      deliveredAt: null,
      createdAt: now,
      updatedAt: now,
    };
  };

  const insert = (rows: readonly Concepto[]): void => {
    const current = db.get();
    db.set({ ...current, conceptos: [...current.conceptos, ...rows] });
    for (const row of rows) db.emit({ entity: 'concepto', op: 'upsert', row });
  };

  return {
    listByRange: (range) =>
      Promise.resolve(
        ok(
          db
            .get()
            .conceptos.filter((concepto) => inRange(concepto.date, range.from, range.to))
            .toSorted(
              (left, right) =>
                compareIso(left.date, right.date) || left.createdAt.localeCompare(right.createdAt),
            ),
        ),
      ),

    create: (input) => {
      const row = build(input);
      insert([row]);
      return Promise.resolve(ok(row));
    },

    createMany: (inputs) => {
      const rows = inputs.map(build);
      insert(rows);
      return Promise.resolve(ok(rows));
    },

    update: (id: ConceptoId, patch: ConceptoPatch) => {
      const current = db.get();
      const existing = current.conceptos.find((concepto) => concepto.id === id);
      if (existing === undefined) return Promise.resolve(err({ kind: 'not_found' as const }));
      const row: Concepto = { ...existing, ...patch, updatedAt: deps.clock.nowInstant() };
      db.set({
        ...current,
        conceptos: current.conceptos.map((concepto) => (concepto.id === id ? row : concepto)),
      });
      db.emit({ entity: 'concepto', op: 'upsert', row });
      return Promise.resolve(ok(row));
    },

    remove: (id) => {
      const current = db.get();
      if (!current.conceptos.some((concepto) => concepto.id === id)) {
        return Promise.resolve(err({ kind: 'not_found' as const }));
      }
      db.set({
        ...current,
        conceptos: current.conceptos.filter((concepto) => concepto.id !== id),
      });
      db.emit({ entity: 'concepto', op: 'delete', id });
      return Promise.resolve(ok(undefined));
    },
  };
};

export const createLocalEditorRepository = (db: LocalDbHandle, deps: LocalDeps): EditorRepository => ({
  list: () => Promise.resolve(ok(db.get().editors)),

  create: (input) => {
    const current = db.get();
    const row: Editor = {
      id: asEditorId(deps.ids.newId()),
      name: input.name,
      dailyGoal: input.dailyGoal,
      active: true,
      sortOrder: current.editors.length,
    };
    db.set({ ...current, editors: [...current.editors, row] });
    db.emit({ entity: 'editor', op: 'upsert', row });
    return Promise.resolve(ok(row));
  },

  update: (id: EditorId, patch) => {
    const current = db.get();
    const existing = current.editors.find((editor) => editor.id === id);
    if (existing === undefined) return Promise.resolve(err({ kind: 'not_found' as const }));
    const row: Editor = { ...existing, ...patch };
    db.set({
      ...current,
      editors: current.editors.map((editor) => (editor.id === id ? row : editor)),
    });
    db.emit({ entity: 'editor', op: 'upsert', row });
    return Promise.resolve(ok(row));
  },
});

export const createLocalSettingsRepository = (db: LocalDbHandle): SettingsRepository => ({
  get: () => Promise.resolve(ok(db.get().settings)),

  update: (patch) => {
    const current = db.get();
    const row = { ...current.settings, ...patch };
    db.set({ ...current, settings: row });
    db.emit({ entity: 'settings', op: 'upsert', row });
    return Promise.resolve(ok(row));
  },
});

export const createLocalDailyGoalRepository = (db: LocalDbHandle): DailyGoalRepository => ({
  listByRange: (range) =>
    Promise.resolve(
      ok(db.get().dailyGoals.filter((goal) => inRange(goal.date, range.from, range.to))),
    ),

  /** Congela metas sin pisar las que ya existen: un día ya medido no se recalifica. */
  snapshot: (entries) => {
    const current = db.get();
    const known = new Set(current.dailyGoals.map((goal) => goalKey(goal.editorId, goal.date)));
    const nuevos = entries.filter((entry) => !known.has(goalKey(entry.editorId, entry.date)));
    if (nuevos.length > 0) {
      db.set({ ...current, dailyGoals: [...current.dailyGoals, ...nuevos] });
      db.emit({ entity: 'all', op: 'invalidate' });
    }
    return Promise.resolve(ok(nuevos as readonly DailyGoal[]));
  },
});

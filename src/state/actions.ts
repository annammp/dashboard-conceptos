/**
 * Los comandos que la UI despacha. Solo orquestan: la decisión de negocio la
 * toma el dominio (`transition`) y la persistencia los puertos.
 *
 * Las escrituras son optimistas — se ve el cambio al instante— y se revierten
 * con un aviso si el repositorio falla.
 */

import {
  effectiveGoal,
  indexDailyGoals,
  transition,
  type Concepto,
  type ConceptoId,
  type ConceptoStatus,
  type DailyGoal,
  type Editor,
  type EditorId,
  type IsoDate,
} from '../domain';
import { describeError, type DataGateway, type RepoError } from '../ports';
import { upsertConcepto, upsertEditor } from './changes';
import type { Store } from './store';
import type { DashboardState } from './types';

export interface ActionDeps {
  readonly store: Store<DashboardState>;
  readonly gateway: DataGateway;
  readonly reload: () => Promise<void>;
}

const fail = (store: Store<DashboardState>, error: RepoError): void => {
  store.set((state) => ({ ...state, notice: describeError(error) }));
};

/**
 * Congela la meta de cada editor activo para ese día la primera vez que se
 * toca. Sin esto, cambiar la meta mañana reescribiría el significado de hoy.
 */
const snapshotGoals = async (deps: ActionDeps, date: IsoDate): Promise<void> => {
  const state = deps.store.get();
  const index = indexDailyGoals(state.dailyGoals);
  const entries: DailyGoal[] = state.editors
    .filter((editor) => editor.active)
    .map((editor) => ({ editorId: editor.id, date, goal: effectiveGoal(editor, date, index) }));
  const result = await deps.gateway.dailyGoals.snapshot(entries);
  if (result.ok && result.value.length > 0) {
    deps.store.set((current) => ({
      ...current,
      dailyGoals: [...current.dailyGoals, ...result.value],
    }));
  }
};

export const createActions = (deps: ActionDeps) => {
  const { store, gateway } = deps;

  const patchConcepto = (row: Concepto): void => {
    store.set((state) => ({
      ...state,
      conceptos: state.conceptos.map((concepto) => (concepto.id === row.id ? row : concepto)),
    }));
  };

  return {
    selectDate: async (date: IsoDate): Promise<void> => {
      store.set((state) => ({ ...state, selectedDate: date }));
      await deps.reload();
    },

    dismissNotice: (): void => {
      store.set((state) => (state.notice === null ? state : { ...state, notice: null }));
    },

    /** Crea `count` conceptos sin título: registrar es tan rápido como teclear un número. */
    addConceptos: async (editorId: EditorId, count = 1): Promise<void> => {
      const date = store.get().selectedDate;
      await snapshotGoals(deps, date);
      const result = await gateway.conceptos.createMany(
        Array.from({ length: count }, () => ({ editorId, date, title: '' })),
      );
      if (!result.ok) return fail(store, result.error);
      // Upsert y no append: el eco del tiempo real pudo llegar primero.
      store.set((state) => ({
        ...state,
        conceptos: result.value.reduce(upsertConcepto, state.conceptos),
      }));
    },

    moveConcepto: async (id: ConceptoId, to: ConceptoStatus): Promise<void> => {
      const existing = store.get().conceptos.find((concepto) => concepto.id === id);
      if (existing === undefined) return;
      // El dominio decide: estado nuevo y deliveredAt coherente.
      const moved = transition(existing, to, existing.updatedAt);
      if (!moved.ok) return;

      patchConcepto(moved.value); // optimista
      const result = await gateway.conceptos.update(id, {
        status: moved.value.status,
        deliveredAt: moved.value.deliveredAt,
      });
      if (!result.ok) {
        patchConcepto(existing); // revierte
        return fail(store, result.error);
      }
      patchConcepto(result.value); // la fila autoritativa
    },

    renameConcepto: async (id: ConceptoId, title: string): Promise<void> => {
      const existing = store.get().conceptos.find((concepto) => concepto.id === id);
      if (existing === undefined || existing.title === title) return;
      patchConcepto({ ...existing, title });
      const result = await gateway.conceptos.update(id, { title });
      if (!result.ok) {
        patchConcepto(existing);
        return fail(store, result.error);
      }
      patchConcepto(result.value);
    },

    removeConcepto: async (id: ConceptoId): Promise<void> => {
      const previous = store.get().conceptos;
      store.set((state) => ({
        ...state,
        conceptos: state.conceptos.filter((concepto) => concepto.id !== id),
      }));
      const result = await gateway.conceptos.remove(id);
      if (!result.ok) {
        store.set((state) => ({ ...state, conceptos: previous }));
        fail(store, result.error);
      }
    },

    addEditor: async (name: string, dailyGoal: number): Promise<void> => {
      const result = await gateway.editors.create({ name, dailyGoal });
      if (!result.ok) return fail(store, result.error);
      const row = result.value;
      store.set((state) => ({ ...state, editors: upsertEditor(state.editors, row) }));
    },

    updateEditor: async (id: EditorId, patch: Partial<Omit<Editor, 'id'>>): Promise<void> => {
      const result = await gateway.editors.update(id, patch);
      if (!result.ok) return fail(store, result.error);
      const row = result.value;
      store.set((state) => ({
        ...state,
        editors: state.editors.map((editor) => (editor.id === id ? row : editor)),
      }));
    },

    setTeamGoalOverride: async (teamGoalOverride: number | null): Promise<void> => {
      const result = await gateway.settings.update({ teamGoalOverride });
      if (!result.ok) return fail(store, result.error);
      const row = result.value;
      store.set((state) => ({ ...state, settings: row }));
    },

    signIn: async (email: string, redirectTo: string): Promise<void> => {
      const result = await gateway.auth.signInWithMagicLink(email, redirectTo);
      if (!result.ok) return fail(store, result.error);
      store.set((state) => ({ ...state, notice: 'Te mandamos un link por correo.' }));
    },

    signOut: async (): Promise<void> => {
      await gateway.auth.signOut();
    },
  };
};

export type Actions = ReturnType<typeof createActions>;

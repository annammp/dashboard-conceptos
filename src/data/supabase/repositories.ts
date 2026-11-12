/**
 * Los repositorios sobre Supabase. Piden solo las columnas que mapean (nada de
 * `select *`), traen el rango completo en una consulta y devuelven siempre la
 * fila autoritativa que escribió el servidor.
 */

import { err, ok, type Concepto, type ConceptoId, type EditorId } from '../../domain';
import type {
  ConceptoPatch,
  ConceptoRepository,
  DailyGoalRepository,
  EditorRepository,
  Fallible,
  NewConcepto,
  SettingsRepository,
} from '../../ports';
import type { AppSupabaseClient } from './client';
import { toRepoError } from './errors';
import { fromEditorPatch, fromSettings, toConcepto, toDailyGoal, toEditor, toSettings } from './mappers';
import {
  CONCEPTO_COLUMNS,
  DAILY_GOAL_COLUMNS,
  EDITOR_COLUMNS,
  SETTINGS_COLUMNS,
  type ConceptoRow,
  type DailyGoalRow,
  type EditorRow,
  type SettingsRow,
} from './schema';

const nuevoARow = (input: NewConcepto): Record<string, unknown> => ({
  editor_id: input.editorId,
  work_date: input.date,
  title: input.title,
  status: input.status ?? 'en_progreso',
});

const patchARow = (patch: ConceptoPatch): Record<string, unknown> => {
  const row: Record<string, unknown> = {};
  if (patch.title !== undefined) row['title'] = patch.title;
  if (patch.status !== undefined) row['status'] = patch.status;
  if (patch.editorId !== undefined) row['editor_id'] = patch.editorId;
  if (patch.date !== undefined) row['work_date'] = patch.date;
  // `delivered_at` lo calcula el dominio y además lo garantiza un trigger.
  if (patch.deliveredAt !== undefined) row['delivered_at'] = patch.deliveredAt;
  return row;
};

export const createSupabaseConceptoRepository = (
  client: AppSupabaseClient,
): ConceptoRepository => {
  const insertar = async (rows: readonly Record<string, unknown>[]): Fallible<Concepto[]> => {
    const { data, error } = await client
      .from('conceptos')
      .insert(rows)
      .select(CONCEPTO_COLUMNS)
      .overrideTypes<ConceptoRow[]>();
    if (error !== null) return err(toRepoError(error));
    return ok(data.map(toConcepto));
  };

  return {
    listByRange: async (range) => {
      const { data, error } = await client
        .from('conceptos')
        .select(CONCEPTO_COLUMNS)
        .gte('work_date', range.from)
        .lte('work_date', range.to)
        .order('work_date', { ascending: true })
        .order('created_at', { ascending: true })
        .overrideTypes<ConceptoRow[]>();
      if (error !== null) return err(toRepoError(error));
      return ok(data.map(toConcepto));
    },

    create: async (input) => {
      const result = await insertar([nuevoARow(input)]);
      if (!result.ok) return result;
      const [row] = result.value;
      return row === undefined ? err({ kind: 'unknown', detail: 'sin fila' }) : ok(row);
    },

    // Un solo insert con N filas, no N llamadas.
    createMany: async (inputs) => await insertar(inputs.map(nuevoARow)),

    update: async (id: ConceptoId, patch: ConceptoPatch) => {
      const { data, error } = await client
        .from('conceptos')
        .update(patchARow(patch))
        .eq('id', id)
        .select(CONCEPTO_COLUMNS)
        .single()
        .overrideTypes<ConceptoRow>();
      if (error !== null) return err(toRepoError(error));
      return ok(toConcepto(data));
    },

    remove: async (id) => {
      const { error } = await client.from('conceptos').delete().eq('id', id);
      return error === null ? ok(undefined) : err(toRepoError(error));
    },
  };
};

export const createSupabaseEditorRepository = (client: AppSupabaseClient): EditorRepository => ({
  list: async () => {
    const { data, error } = await client
      .from('editors')
      .select(EDITOR_COLUMNS)
      .order('sort_order', { ascending: true })
      .overrideTypes<EditorRow[]>();
    if (error !== null) return err(toRepoError(error));
    return ok(data.map(toEditor));
  },

  create: async (input) => {
    const { data, error } = await client
      .from('editors')
      .insert({ name: input.name, daily_goal: input.dailyGoal })
      .select(EDITOR_COLUMNS)
      .single()
      .overrideTypes<EditorRow>();
    if (error !== null) return err(toRepoError(error));
    return ok(toEditor(data));
  },

  update: async (id: EditorId, patch) => {
    const { data, error } = await client
      .from('editors')
      .update(fromEditorPatch(patch))
      .eq('id', id)
      .select(EDITOR_COLUMNS)
      .single()
      .overrideTypes<EditorRow>();
    if (error !== null) return err(toRepoError(error));
    return ok(toEditor(data));
  },
});

export const createSupabaseSettingsRepository = (
  client: AppSupabaseClient,
): SettingsRepository => ({
  get: async () => {
    const { data, error } = await client
      .from('app_settings')
      .select(SETTINGS_COLUMNS)
      .single()
      .overrideTypes<SettingsRow>();
    if (error !== null) return err(toRepoError(error));
    return ok(toSettings(data));
  },

  update: async (patch) => {
    const { data, error } = await client
      .from('app_settings')
      .update(fromSettings(patch))
      .eq('id', true)
      .select(SETTINGS_COLUMNS)
      .single()
      .overrideTypes<SettingsRow>();
    if (error !== null) return err(toRepoError(error));
    return ok(toSettings(data));
  },
});

export const createSupabaseDailyGoalRepository = (
  client: AppSupabaseClient,
): DailyGoalRepository => ({
  listByRange: async (range) => {
    const { data, error } = await client
      .from('daily_goals')
      .select(DAILY_GOAL_COLUMNS)
      .gte('work_date', range.from)
      .lte('work_date', range.to)
      .overrideTypes<DailyGoalRow[]>();
    if (error !== null) return err(toRepoError(error));
    return ok(data.map(toDailyGoal));
  },

  /** `ignoreDuplicates`: un día ya congelado no se recalifica. */
  snapshot: async (entries) => {
    if (entries.length === 0) return ok([]);
    const { data, error } = await client
      .from('daily_goals')
      .upsert(
        entries.map((entry) => ({
          editor_id: entry.editorId,
          work_date: entry.date,
          goal: entry.goal,
        })),
        { onConflict: 'editor_id,work_date', ignoreDuplicates: true },
      )
      .select(DAILY_GOAL_COLUMNS)
      .overrideTypes<DailyGoalRow[]>();
    if (error !== null) return err(toRepoError(error));
    return ok(data.map(toDailyGoal));
  },
});

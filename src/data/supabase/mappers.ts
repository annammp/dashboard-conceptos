/**
 * La frontera entre el `snake_case` de la base y el dominio. Aquí y solo aquí:
 * si un nombre de columna cambia, se toca este archivo y nada más.
 */

import {
  asConceptoId,
  asEditorId,
  asInstant,
  type AppSettings,
  type Concepto,
  type DailyGoal,
  type Editor,
  type IsoDate,
} from '../../domain';
import type { ConceptoRow, DailyGoalRow, EditorRow, SettingsRow } from './schema';

/**
 * `work_date` es un `date` de Postgres y llega ya como `YYYY-MM-DD`. No pasa
 * por `Date` a propósito: ahí es donde se corren los días.
 */
const asIsoDate = (raw: string): IsoDate => raw as IsoDate;

export const toConcepto = (row: ConceptoRow): Concepto => ({
  id: asConceptoId(row.id),
  editorId: asEditorId(row.editor_id),
  date: asIsoDate(row.work_date),
  title: row.title,
  status: row.status,
  deliveredAt: row.delivered_at === null ? null : asInstant(row.delivered_at),
  createdAt: asInstant(row.created_at),
  updatedAt: asInstant(row.updated_at),
});

export const toEditor = (row: EditorRow): Editor => ({
  id: asEditorId(row.id),
  name: row.name,
  dailyGoal: row.daily_goal,
  active: row.active,
  sortOrder: row.sort_order,
});

export const toDailyGoal = (row: DailyGoalRow): DailyGoal => ({
  editorId: asEditorId(row.editor_id),
  date: asIsoDate(row.work_date),
  goal: row.goal,
});

export const toSettings = (row: SettingsRow): AppSettings => ({
  teamGoalOverride: row.team_goal_override,
  encouragementPackId: row.encouragement_pack_id,
});

export const fromSettings = (patch: Partial<AppSettings>): Record<string, unknown> => {
  const row: Record<string, unknown> = {};
  if ('teamGoalOverride' in patch) row['team_goal_override'] = patch.teamGoalOverride;
  if ('encouragementPackId' in patch) row['encouragement_pack_id'] = patch.encouragementPackId;
  return row;
};

export const fromEditorPatch = (patch: Partial<Omit<Editor, 'id'>>): Record<string, unknown> => {
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row['name'] = patch.name;
  if (patch.dailyGoal !== undefined) row['daily_goal'] = patch.dailyGoal;
  if (patch.active !== undefined) row['active'] = patch.active;
  if (patch.sortOrder !== undefined) row['sort_order'] = patch.sortOrder;
  return row;
};

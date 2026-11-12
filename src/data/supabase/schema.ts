/** Las filas tal como vienen de Postgres: `snake_case`. No salen de esta carpeta. */

import type { ConceptoStatus } from '../../domain';

export interface ConceptoRow {
  readonly id: string;
  readonly editor_id: string;
  readonly work_date: string;
  readonly title: string;
  readonly status: ConceptoStatus;
  readonly delivered_at: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface EditorRow {
  readonly id: string;
  readonly name: string;
  readonly daily_goal: number;
  readonly active: boolean;
  readonly sort_order: number;
}

export interface DailyGoalRow {
  readonly editor_id: string;
  readonly work_date: string;
  readonly goal: number;
}

export interface SettingsRow {
  readonly team_goal_override: number | null;
  readonly encouragement_pack_id: string;
}

export const CONCEPTO_COLUMNS =
  'id, editor_id, work_date, title, status, delivered_at, created_at, updated_at';
export const EDITOR_COLUMNS = 'id, name, daily_goal, active, sort_order';
export const DAILY_GOAL_COLUMNS = 'editor_id, work_date, goal';
export const SETTINGS_COLUMNS = 'team_goal_override, encouragement_pack_id';

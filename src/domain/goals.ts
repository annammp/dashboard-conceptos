/**
 * Metas. La de equipo se deriva de la suma de las metas de los editores
 * activos, salvo que se fije a mano.
 *
 * La meta de cada día se congela en un snapshot: si hoy subes la meta de 4 a 5,
 * los días pasados se siguen midiendo contra el 4 que tenían. Sin esto, el
 * historial cambiaría de significado cada vez que alguien ajusta una meta.
 */

import type { DailyGoal, Editor, EditorId, IsoDate } from './types';

export const goalKey = (editorId: EditorId, date: IsoDate): string => `${editorId}|${date}`;

export type DailyGoalIndex = ReadonlyMap<string, number>;

export const indexDailyGoals = (snapshots: readonly DailyGoal[]): DailyGoalIndex => {
  const index = new Map<string, number>();
  for (const snapshot of snapshots) {
    index.set(goalKey(snapshot.editorId, snapshot.date), snapshot.goal);
  }
  return index;
};

/** La meta congelada de ese día si existe; si no, la meta vigente del editor. */
export const effectiveGoal = (editor: Editor, date: IsoDate, index: DailyGoalIndex): number =>
  index.get(goalKey(editor.id, date)) ?? editor.dailyGoal;

export const activeEditors = (editors: readonly Editor[]): readonly Editor[] =>
  editors.filter((editor) => editor.active);

/** `override` en `null` significa "la suma", que es el caso normal: 2 × 4 = 8. */
export const computeTeamGoal = (goals: readonly number[], override: number | null): number =>
  override ?? goals.reduce((total, goal) => total + goal, 0);

export const sortEditors = (editors: readonly Editor[]): readonly Editor[] =>
  [...editors].sort(
    (left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name, 'es'),
  );

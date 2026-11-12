/**
 * Toda la aritmética del dashboard. Si algo aquí está mal, los números que el
 * equipo ve están mal, así que `computeProgress` es la única función que divide
 * y todo lo demás se construye sobre ella.
 */

import { countsTowardGoal } from './status';
import { activeEditors, computeTeamGoal, effectiveGoal, type DailyGoalIndex } from './goals';
import { enumerateDays } from './date';
import type { Concepto, ConceptoStatus, DateRange, Editor, EditorId, IsoDate } from './types';

export type StatusTally = Readonly<Record<ConceptoStatus, number>> & { readonly total: number };

export const tallyByStatus = (conceptos: readonly Concepto[]): StatusTally => {
  const counts: Record<ConceptoStatus, number> = { en_progreso: 0, en_ajustes: 0, entregado: 0 };
  for (const concepto of conceptos) {
    counts[concepto.status] += 1;
  }
  return { ...counts, total: conceptos.length };
};

export interface ProgressStat {
  readonly goal: number;
  readonly delivered: number;
  /** Nunca negativo: superar la meta deja "faltan 0", no "faltan -2". */
  readonly missing: number;
  /** Puede pasar de 1 cuando se supera la meta. Con meta 0 es 1. */
  readonly ratio: number;
  readonly met: boolean;
}

export const computeProgress = (delivered: number, goal: number): ProgressStat => {
  const safeGoal = Math.max(0, goal);
  return {
    goal: safeGoal,
    delivered,
    missing: Math.max(0, safeGoal - delivered),
    ratio: safeGoal === 0 ? 1 : delivered / safeGoal,
    met: delivered >= safeGoal,
  };
};

export const countDelivered = (conceptos: readonly Concepto[]): number =>
  conceptos.filter((concepto) => countsTowardGoal(concepto.status)).length;

export const groupByEditor = (
  conceptos: readonly Concepto[],
): ReadonlyMap<EditorId, readonly Concepto[]> => {
  const groups = new Map<EditorId, Concepto[]>();
  for (const concepto of conceptos) {
    const bucket = groups.get(concepto.editorId);
    if (bucket === undefined) groups.set(concepto.editorId, [concepto]);
    else bucket.push(concepto);
  }
  return groups;
};

export const groupByDate = (
  conceptos: readonly Concepto[],
): ReadonlyMap<IsoDate, readonly Concepto[]> => {
  const groups = new Map<IsoDate, Concepto[]>();
  for (const concepto of conceptos) {
    const bucket = groups.get(concepto.date);
    if (bucket === undefined) groups.set(concepto.date, [concepto]);
    else bucket.push(concepto);
  }
  return groups;
};

export const byStatus = (
  conceptos: readonly Concepto[],
  status: ConceptoStatus,
): readonly Concepto[] => conceptos.filter((concepto) => concepto.status === status);

export interface EditorProgress extends ProgressStat {
  readonly editorId: EditorId;
  readonly name: string;
  readonly tally: StatusTally;
}

export interface DayProgressInput {
  readonly date: IsoDate;
  readonly editors: readonly Editor[];
  readonly conceptos: readonly Concepto[];
  readonly teamGoalOverride: number | null;
  readonly dailyGoals: DailyGoalIndex;
}

export interface DayProgress {
  readonly date: IsoDate;
  readonly team: ProgressStat;
  readonly tally: StatusTally;
  readonly editors: readonly EditorProgress[];
}

/**
 * El progreso del día. Solo mide a los editores activos, pero cuenta todos los
 * conceptos de la fecha: desactivar a alguien no debe borrar lo que entregó.
 */
export const computeDayProgress = (input: DayProgressInput): DayProgress => {
  const ofDay = input.conceptos.filter((concepto) => concepto.date === input.date);
  const byEditor = groupByEditor(ofDay);
  const active = activeEditors(input.editors);

  const editors = active.map((editor): EditorProgress => {
    const own = byEditor.get(editor.id) ?? [];
    const goal = effectiveGoal(editor, input.date, input.dailyGoals);
    return {
      ...computeProgress(countDelivered(own), goal),
      editorId: editor.id,
      name: editor.name,
      tally: tallyByStatus(own),
    };
  });

  const teamGoal = computeTeamGoal(
    editors.map((progress) => progress.goal),
    input.teamGoalOverride,
  );

  return {
    date: input.date,
    team: computeProgress(countDelivered(ofDay), teamGoal),
    tally: tallyByStatus(ofDay),
    editors,
  };
};

export interface TrendPoint {
  readonly date: IsoDate;
  readonly delivered: number;
  readonly goal: number;
  readonly met: boolean;
}

export interface TrendInput {
  readonly range: DateRange;
  readonly editors: readonly Editor[];
  readonly conceptos: readonly Concepto[];
  readonly teamGoalOverride: number | null;
  readonly dailyGoals: DailyGoalIndex;
}

/**
 * Un punto por cada día del rango, incluidos los días sin actividad: un hueco
 * en la gráfica es información, y rellenar con ceros evita que una semana
 * floja parezca una semana corta.
 */
export const buildTrend = (input: TrendInput): readonly TrendPoint[] =>
  enumerateDays(input.range).map((date): TrendPoint => {
    const day = computeDayProgress({
      date,
      editors: input.editors,
      conceptos: input.conceptos,
      teamGoalOverride: input.teamGoalOverride,
      dailyGoals: input.dailyGoals,
    });
    return { date, delivered: day.team.delivered, goal: day.team.goal, met: day.team.met };
  });

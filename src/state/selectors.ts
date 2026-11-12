/**
 * Las derivaciones que consume la UI. Los componentes llaman a selectores, no
 * a `domain/metrics` con argumentos armados a mano: así el cálculo vive en un
 * solo lugar y no puede divergir entre pantallas.
 */

import {
  buildTrend,
  computeDayProgress,
  byStatus,
  indexDailyGoals,
  selectEncouragement,
  sortEditors,
  type Concepto,
  type ConceptoStatus,
  type DayProgress,
  type EncouragementRule,
  type EditorId,
  type EncouragementScope,
  type ProgressStat,
  type TrendPoint,
} from '../domain';
import { DEFAULT_ENCOURAGEMENT_PACK } from '../config/encouragement.pack';
import { describeError } from '../ports';
import type { DashboardState } from './types';


/**
 * `useSyncExternalStore` exige que el snapshot sea estable: si el selector
 * devuelve un objeto nuevo en cada llamada, React re-renderiza en bucle.
 *
 * El store sustituye el objeto de estado completo en cada cambio, así que
 * basta con cachear por identidad: mismo estado, mismo resultado.
 */
const memoize = <T>(select: (state: DashboardState) => T): ((state: DashboardState) => T) => {
  let lastState: DashboardState | null = null;
  let lastResult: T | null = null;
  return (state) => {
    if (state !== lastState || lastResult === null) {
      lastState = state;
      lastResult = select(state);
    }
    return lastResult;
  };
};

export const selectVisibleConceptos = memoize((state: DashboardState): readonly Concepto[] =>
  state.conceptos.filter((concepto) => concepto.date === state.selectedDate),
);

export const selectColumn = (
  state: DashboardState,
  status: ConceptoStatus,
): readonly Concepto[] => byStatus(selectVisibleConceptos(state), status);

export const selectDayProgress = memoize(
  (state: DashboardState): DayProgress =>
    computeDayProgress({
      date: state.selectedDate,
      editors: state.editors,
      conceptos: state.conceptos,
      teamGoalOverride: state.settings.teamGoalOverride,
      dailyGoals: indexDailyGoals(state.dailyGoals),
    }),
);

export const selectTrend = memoize((state: DashboardState): readonly TrendPoint[] =>
  buildTrend({
    range: state.range,
    editors: state.editors,
    conceptos: state.conceptos,
    teamGoalOverride: state.settings.teamGoalOverride,
    dailyGoals: indexDailyGoals(state.dailyGoals),
  }),
);

export const selectEncouragementFor = (
  stat: ProgressStat,
  scope: EncouragementScope,
): EncouragementRule => selectEncouragement(stat, scope, DEFAULT_ENCOURAGEMENT_PACK);

export const selectSortedEditors = memoize((state: DashboardState) => sortEditors(state.editors));

export const selectCanWrite = (state: DashboardState): boolean =>
  state.session?.canWrite ?? false;

export const selectEditorName = memoize((state: DashboardState) => {
  const names = new Map(state.editors.map((editor) => [editor.id, editor.name]));
  return (id: EditorId): string => names.get(id) ?? 'Sin asignar';
});

// Selectores estables para valores simples: definirlos aquí evita crear una
// función nueva en cada render del componente.
export const selectStatus = (state: DashboardState) => state.status;
export const selectIsReady = (state: DashboardState): boolean => state.status === 'ready';
export const selectSelectedDate = (state: DashboardState) => state.selectedDate;
export const selectNotice = (state: DashboardState) => state.notice;
export const selectLive = (state: DashboardState): boolean => state.live;

/** El error de carga, ya en palabras. Así la UI no necesita conocer los puertos. */
export const selectErrorMessage = (state: DashboardState): string =>
  state.error === null ? 'No se pudo cargar.' : describeError(state.error);

/** Carga inicial y recargas: trae en paralelo todo lo que necesita una ventana. */

import { lastNDays, todayIso, type DateRange, type IsoDate } from '../domain';
import { HISTORY_WINDOW_DAYS } from '../config/defaults';
import type { Clock, DataGateway, RepoError } from '../ports';
import type { DashboardState } from './types';

/** La ventana cargada termina en el día visible, o en hoy si se está mirando atrás. */
export const rangeFor = (selectedDate: IsoDate, today: IsoDate): DateRange => {
  const end = selectedDate > today ? selectedDate : today;
  const window = lastNDays(end, HISTORY_WINDOW_DAYS);
  return selectedDate < window.from ? { from: selectedDate, to: end } : window;
};

export const initialState = (clock: Clock): DashboardState => {
  const today = todayIso(clock.now());
  return {
    status: 'loading',
    error: null,
    selectedDate: today,
    range: rangeFor(today, today),
    editors: [],
    conceptos: [],
    dailyGoals: [],
    settings: { teamGoalOverride: null, encouragementPackId: 'default' },
    session: null,
    live: false,
    notice: null,
  };
};

export interface LoadedData {
  readonly editors: DashboardState['editors'];
  readonly conceptos: DashboardState['conceptos'];
  readonly dailyGoals: DashboardState['dailyGoals'];
  readonly settings: DashboardState['settings'];
}

export const loadRange = async (
  gateway: DataGateway,
  range: DateRange,
): Promise<{ ok: true; data: LoadedData } | { ok: false; error: RepoError }> => {
  const [editors, conceptos, dailyGoals, settings] = await Promise.all([
    gateway.editors.list(),
    gateway.conceptos.listByRange(range),
    gateway.dailyGoals.listByRange(range),
    gateway.settings.get(),
  ]);
  if (!editors.ok) return { ok: false, error: editors.error };
  if (!conceptos.ok) return { ok: false, error: conceptos.error };
  if (!dailyGoals.ok) return { ok: false, error: dailyGoals.error };
  if (!settings.ok) return { ok: false, error: settings.error };
  return {
    ok: true,
    data: {
      editors: editors.value,
      conceptos: conceptos.value,
      dailyGoals: dailyGoals.value,
      settings: settings.value,
    },
  };
};

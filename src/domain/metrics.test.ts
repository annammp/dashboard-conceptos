import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildTrend,
  byStatus,
  computeDayProgress,
  computeProgress,
  countDelivered,
  groupByDate,
  groupByEditor,
  tallyByStatus,
} from './metrics';
import { indexDailyGoals } from './goals';
import {
  isoDate,
  makeConcepto,
  makeDelivered,
  makeEditor,
  resetSequence,
  TODAY,
} from '../test/factories';

beforeEach(resetSequence);

const noGoals = indexDailyGoals([]);

describe('computeProgress', () => {
  it('calcula el caso normal: 3 de 4', () => {
    expect(computeProgress(3, 4)).toEqual({
      goal: 4,
      delivered: 3,
      missing: 1,
      ratio: 0.75,
      met: false,
    });
  });

  it('con la meta exacta queda cumplida y sin faltantes', () => {
    expect(computeProgress(4, 4)).toMatchObject({ missing: 0, ratio: 1, met: true });
  });

  /** Superar la meta deja "faltan 0", nunca un negativo en pantalla. */
  it('al superar la meta el faltante no se vuelve negativo', () => {
    expect(computeProgress(6, 4)).toMatchObject({ missing: 0, ratio: 1.5, met: true });
  });

  it('con meta 0 no hay nada pendiente', () => {
    expect(computeProgress(0, 0)).toMatchObject({ missing: 0, ratio: 1, met: true });
  });

  it('una meta negativa se trata como 0 en vez de romper el ratio', () => {
    expect(computeProgress(0, -3)).toMatchObject({ goal: 0, missing: 0, ratio: 1 });
  });

  it('sin entregados el ratio es 0', () => {
    expect(computeProgress(0, 4)).toMatchObject({ missing: 4, ratio: 0, met: false });
  });
});

describe('tallyByStatus', () => {
  it('cuenta por estado y el total', () => {
    const conceptos = [
      makeConcepto({ status: 'en_progreso' }),
      makeConcepto({ status: 'en_ajustes' }),
      makeConcepto({ status: 'entregado' }),
      makeConcepto({ status: 'entregado' }),
    ];
    expect(tallyByStatus(conceptos)).toEqual({
      en_progreso: 1,
      en_ajustes: 1,
      entregado: 2,
      total: 4,
    });
  });

  it('una lista vacía da ceros', () => {
    expect(tallyByStatus([])).toEqual({ en_progreso: 0, en_ajustes: 0, entregado: 0, total: 0 });
  });

  it('solo los entregados cuentan para la meta', () => {
    const conceptos = [
      makeConcepto({ status: 'entregado' }),
      makeConcepto({ status: 'en_ajustes' }),
      makeConcepto({ status: 'en_progreso' }),
    ];
    expect(countDelivered(conceptos)).toBe(1);
  });
});

describe('agrupaciones', () => {
  it('agrupa por editor', () => {
    const ana = makeEditor({ name: 'Ana' });
    const bruno = makeEditor({ name: 'Bruno' });
    const conceptos = [
      makeConcepto({ editorId: ana.id }),
      makeConcepto({ editorId: ana.id }),
      makeConcepto({ editorId: bruno.id }),
    ];
    const groups = groupByEditor(conceptos);
    expect(groups.get(ana.id)).toHaveLength(2);
    expect(groups.get(bruno.id)).toHaveLength(1);
  });

  it('agrupa por fecha', () => {
    const ayer = isoDate('2026-11-11');
    const conceptos = [makeConcepto({ date: ayer }), makeConcepto({ date: TODAY })];
    const groups = groupByDate(conceptos);
    expect(groups.get(ayer)).toHaveLength(1);
    expect(groups.get(TODAY)).toHaveLength(1);
  });

  it('acumula varios conceptos en la misma fecha', () => {
    const groups = groupByDate([makeConcepto({ date: TODAY }), makeConcepto({ date: TODAY })]);
    expect(groups.get(TODAY)).toHaveLength(1 + 1);
  });

  it('filtra por estado', () => {
    const conceptos = [
      makeConcepto({ status: 'en_ajustes' }),
      makeConcepto({ status: 'entregado' }),
    ];
    expect(byStatus(conceptos, 'en_ajustes')).toHaveLength(1);
  });
});

describe('computeDayProgress', () => {
  const ana = makeEditor({ name: 'Ana', dailyGoal: 4, sortOrder: 0 });
  const bruno = makeEditor({ name: 'Bruno', dailyGoal: 4, sortOrder: 1 });

  const dayProgress = (conceptos: ReturnType<typeof makeConcepto>[], override: number | null = null) =>
    computeDayProgress({
      date: TODAY,
      editors: [ana, bruno],
      conceptos,
      teamGoalOverride: override,
      dailyGoals: noGoals,
    });

  it('la meta de equipo es la suma: 2 x 4 = 8', () => {
    expect(dayProgress([]).team.goal).toBe(8);
  });

  it('un día sin conceptos deja todo en cero y nada cumplido', () => {
    const day = dayProgress([]);
    expect(day.team).toMatchObject({ delivered: 0, missing: 8, met: false });
    expect(day.editors).toHaveLength(2);
    expect(day.editors[0]).toMatchObject({ name: 'Ana', delivered: 0, missing: 4 });
  });

  it('atribuye los entregados a su editor', () => {
    const day = dayProgress([...makeDelivered(3, ana.id), ...makeDelivered(1, bruno.id)]);
    expect(day.editors[0]).toMatchObject({ name: 'Ana', delivered: 3, missing: 1 });
    expect(day.editors[1]).toMatchObject({ name: 'Bruno', delivered: 1, missing: 3 });
    expect(day.team).toMatchObject({ delivered: 4, missing: 4 });
  });

  it('con 4 de 4 el editor cumple su meta', () => {
    const day = dayProgress(makeDelivered(4, ana.id));
    expect(day.editors[0]).toMatchObject({ met: true, missing: 0, ratio: 1 });
    expect(day.team.met).toBe(false);
  });

  it('con 8 entregados el equipo cumple', () => {
    const day = dayProgress([...makeDelivered(4, ana.id), ...makeDelivered(4, bruno.id)]);
    expect(day.team).toMatchObject({ delivered: 8, missing: 0, met: true });
  });

  it('ignora los conceptos de otros días', () => {
    const conceptos = [
      ...makeDelivered(2, ana.id, TODAY),
      ...makeDelivered(5, ana.id, isoDate('2026-11-11')),
    ];
    expect(dayProgress(conceptos).team.delivered).toBe(2);
  });

  it('respeta un override de meta de equipo', () => {
    expect(dayProgress([], 10).team.goal).toBe(10);
  });

  /** Desactivar a alguien lo saca de la medición, pero no borra lo que entregó. */
  it('un editor inactivo no se mide pero su trabajo sigue contando al equipo', () => {
    const inactiva = makeEditor({ name: 'Carla', active: false, dailyGoal: 4 });
    const day = computeDayProgress({
      date: TODAY,
      editors: [ana, inactiva],
      conceptos: [...makeDelivered(1, ana.id), ...makeDelivered(2, inactiva.id)],
      teamGoalOverride: null,
      dailyGoals: noGoals,
    });
    expect(day.editors.map((editor) => editor.name)).toEqual(['Ana']);
    expect(day.team.goal).toBe(4);
    expect(day.team.delivered).toBe(3);
    expect(day.tally.total).toBe(3);
  });

  it('con un solo editor la meta de equipo es la suya', () => {
    const day = computeDayProgress({
      date: TODAY,
      editors: [ana],
      conceptos: [],
      teamGoalOverride: null,
      dailyGoals: noGoals,
    });
    expect(day.team.goal).toBe(4);
  });

  it('usa la meta congelada del día en vez de la vigente', () => {
    const day = computeDayProgress({
      date: TODAY,
      editors: [ana],
      conceptos: makeDelivered(3, ana.id),
      teamGoalOverride: null,
      dailyGoals: indexDailyGoals([{ editorId: ana.id, date: TODAY, goal: 3 }]),
    });
    expect(day.editors[0]).toMatchObject({ goal: 3, met: true });
  });
});

describe('buildTrend', () => {
  const ana = makeEditor({ name: 'Ana', dailyGoal: 4 });
  const range = { from: isoDate('2026-11-10'), to: isoDate('2026-11-12') };

  it('da un punto por día, en orden, rellenando los días sin actividad', () => {
    const trend = buildTrend({
      range,
      editors: [ana],
      conceptos: makeDelivered(2, ana.id, isoDate('2026-11-11')),
      teamGoalOverride: null,
      dailyGoals: noGoals,
    });
    expect(trend.map((point) => point.date)).toEqual(['2026-11-10', '2026-11-11', '2026-11-12']);
    expect(trend.map((point) => point.delivered)).toEqual([0, 2, 0]);
    expect(trend.every((point) => point.goal === 4)).toBe(true);
  });

  it('marca los días en que se cumplió la meta', () => {
    const trend = buildTrend({
      range,
      editors: [ana],
      conceptos: makeDelivered(4, ana.id, isoDate('2026-11-12')),
      teamGoalOverride: null,
      dailyGoals: noGoals,
    });
    expect(trend.map((point) => point.met)).toEqual([false, false, true]);
  });

  it('cada día usa su propia meta congelada', () => {
    const trend = buildTrend({
      range: { from: isoDate('2026-11-11'), to: isoDate('2026-11-12') },
      editors: [ana],
      conceptos: [],
      teamGoalOverride: null,
      dailyGoals: indexDailyGoals([
        { editorId: ana.id, date: isoDate('2026-11-11'), goal: 3 },
        { editorId: ana.id, date: isoDate('2026-11-12'), goal: 5 },
      ]),
    });
    expect(trend.map((point) => point.goal)).toEqual([3, 5]);
  });

  it('un rango invertido no produce puntos', () => {
    const trend = buildTrend({
      range: { from: isoDate('2026-11-12'), to: isoDate('2026-11-10') },
      editors: [ana],
      conceptos: [],
      teamGoalOverride: null,
      dailyGoals: noGoals,
    });
    expect(trend).toEqual([]);
  });
});

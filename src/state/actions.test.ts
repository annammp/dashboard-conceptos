import { beforeEach, describe, expect, it } from 'vitest';
import { createDashboard } from './dashboardStore';
import { selectDayProgress } from './selectors';
import { createFakeClock, createFakeIds, createMemoryPersistence } from '../test/fakes';
import { createLocalGateway } from '../data/local/gateway';
import { err, type ConceptoId } from '../domain';
import type { DataGateway } from '../ports';

const HOY = '2026-11-12';

const setup = async (override?: (gateway: DataGateway) => DataGateway) => {
  const clock = createFakeClock(`${HOY}T15:00:00.000Z`).clock;
  const base = createLocalGateway({
    ids: createFakeIds('c'),
    clock,
    persistence: createMemoryPersistence(),
  });
  const gateway = override ? override(base) : base;
  const dashboard = createDashboard({ gateway, clock });
  await dashboard.start();
  return dashboard;
};

let dashboard: Awaited<ReturnType<typeof setup>> | null = null;
beforeEach(() => {
  dashboard?.dispose();
  dashboard = null;
});

describe('carga inicial', () => {
  it('deja el estado listo con los editores sembrados', async () => {
    dashboard = await setup();
    const state = dashboard.store.get();
    expect(state.status).toBe('ready');
    expect(state.editors).toHaveLength(2);
    expect(state.selectedDate).toBe(HOY);
  });

  it('la meta de equipo arranca en 8 (2 editores x 4)', async () => {
    dashboard = await setup();
    expect(selectDayProgress(dashboard.store.get()).team.goal).toBe(8);
  });
});

describe('registrar conceptos', () => {
  it('agrega uno y lo deja en progreso', async () => {
    dashboard = await setup();
    const editor = dashboard.store.get().editors[0]!;
    await dashboard.actions.addConceptos(editor.id);
    const state = dashboard.store.get();
    expect(state.conceptos).toHaveLength(1);
    expect(state.conceptos[0]?.status).toBe('en_progreso');
  });

  /** Regresión: la acción y el eco del tiempo real llegaban a duplicar la fila. */
  it('no duplica aunque el eco del tiempo real llegue primero', async () => {
    dashboard = await setup();
    const editor = dashboard.store.get().editors[0]!;
    await dashboard.actions.addConceptos(editor.id);
    await dashboard.actions.addConceptos(editor.id);
    const ids = dashboard.store.get().conceptos.map((concepto) => concepto.id);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });

  it('agrega varios de golpe', async () => {
    dashboard = await setup();
    const editor = dashboard.store.get().editors[0]!;
    await dashboard.actions.addConceptos(editor.id, 4);
    expect(dashboard.store.get().conceptos).toHaveLength(4);
  });

  /** La meta del día se congela al tocarlo, no cuando alguien la cambie después. */
  it('congela la meta del día al registrar el primer concepto', async () => {
    dashboard = await setup();
    const editor = dashboard.store.get().editors[0]!;
    await dashboard.actions.addConceptos(editor.id);
    const metas = dashboard.store.get().dailyGoals;
    expect(metas.length).toBeGreaterThan(0);
    expect(metas.every((meta) => meta.goal === 4)).toBe(true);
  });

  it('subir la meta después no recalifica el día ya congelado', async () => {
    dashboard = await setup();
    const editor = dashboard.store.get().editors[0]!;
    await dashboard.actions.addConceptos(editor.id);
    await dashboard.actions.updateEditor(editor.id, { dailyGoal: 9 });
    const progreso = selectDayProgress(dashboard.store.get());
    expect(progreso.editors[0]?.goal).toBe(4);
  });
});

describe('mover conceptos', () => {
  it('entregar baja el faltante y marca la fecha de entrega', async () => {
    dashboard = await setup();
    const editor = dashboard.store.get().editors[0]!;
    await dashboard.actions.addConceptos(editor.id);
    const concepto = dashboard.store.get().conceptos[0]!;

    await dashboard.actions.moveConcepto(concepto.id, 'entregado');

    const state = dashboard.store.get();
    expect(state.conceptos[0]?.status).toBe('entregado');
    expect(state.conceptos[0]?.deliveredAt).not.toBeNull();
    expect(selectDayProgress(state).editors[0]).toMatchObject({ delivered: 1, missing: 3 });
  });

  it('ignora una transición ilegal en vez de romper', async () => {
    dashboard = await setup();
    const editor = dashboard.store.get().editors[0]!;
    await dashboard.actions.addConceptos(editor.id);
    const concepto = dashboard.store.get().conceptos[0]!;
    await dashboard.actions.moveConcepto(concepto.id, 'entregado');

    await dashboard.actions.moveConcepto(concepto.id, 'en_progreso'); // no permitida

    expect(dashboard.store.get().conceptos[0]?.status).toBe('entregado');
  });

  /** Lo que evita que un fallo de red deje la pantalla mintiendo. */
  it('revierte y avisa cuando el repositorio falla', async () => {
    dashboard = await setup((gateway) => ({
      ...gateway,
      conceptos: {
        ...gateway.conceptos,
        update: () => Promise.resolve(err({ kind: 'offline' as const })),
      },
    }));
    const editor = dashboard.store.get().editors[0]!;
    await dashboard.actions.addConceptos(editor.id);
    const concepto = dashboard.store.get().conceptos[0]!;

    await dashboard.actions.moveConcepto(concepto.id, 'entregado');

    const state = dashboard.store.get();
    expect(state.conceptos[0]?.status).toBe('en_progreso');
    expect(state.notice).toContain('Sin conexión');
  });

  it('borrar revierte si el repositorio falla', async () => {
    dashboard = await setup((gateway) => ({
      ...gateway,
      conceptos: {
        ...gateway.conceptos,
        remove: () => Promise.resolve(err({ kind: 'offline' as const })),
      },
    }));
    const editor = dashboard.store.get().editors[0]!;
    await dashboard.actions.addConceptos(editor.id);
    const concepto = dashboard.store.get().conceptos[0]!;

    await dashboard.actions.removeConcepto(concepto.id);

    expect(dashboard.store.get().conceptos).toHaveLength(1);
  });

  it('no hace nada con un id que no existe', async () => {
    dashboard = await setup();
    await dashboard.actions.moveConcepto('fantasma' as ConceptoId, 'entregado');
    expect(dashboard.store.get().conceptos).toHaveLength(0);
  });
});

describe('metas y editores', () => {
  it('cambiar la meta de equipo recalcula el faltante', async () => {
    dashboard = await setup();
    await dashboard.actions.setTeamGoalOverride(10);
    expect(selectDayProgress(dashboard.store.get()).team).toMatchObject({ goal: 10, missing: 10 });
  });

  it('agregar un editor sube la meta de equipo', async () => {
    dashboard = await setup();
    await dashboard.actions.addEditor('Carla', 4);
    expect(selectDayProgress(dashboard.store.get()).team.goal).toBe(12);
  });

  it('desactivar un editor lo saca de la medición', async () => {
    dashboard = await setup();
    const editor = dashboard.store.get().editors[0]!;
    await dashboard.actions.updateEditor(editor.id, { active: false });
    const progreso = selectDayProgress(dashboard.store.get());
    expect(progreso.editors).toHaveLength(1);
    expect(progreso.team.goal).toBe(4);
  });

  it('el aviso se puede descartar', async () => {
    dashboard = await setup();
    await dashboard.actions.setTeamGoalOverride(1);
    dashboard.store.set((state) => ({ ...state, notice: 'algo' }));
    dashboard.actions.dismissNotice();
    expect(dashboard.store.get().notice).toBeNull();
  });
});

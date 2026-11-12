import { describe, expect, it } from 'vitest';
import {
  activeEditors,
  computeTeamGoal,
  effectiveGoal,
  goalKey,
  indexDailyGoals,
  sortEditors,
} from './goals';
import { isoDate, makeEditor } from '../test/factories';

describe('computeTeamGoal', () => {
  it('suma las metas cuando no hay override: 2 x 4 = 8', () => {
    expect(computeTeamGoal([4, 4], null)).toBe(8);
  });

  it('respeta un override, incluso si difiere de la suma', () => {
    expect(computeTeamGoal([4, 4], 10)).toBe(10);
  });

  it('un override de 0 es un override, no "sin override"', () => {
    expect(computeTeamGoal([4, 4], 0)).toBe(0);
  });

  it('sin editores la meta es 0', () => {
    expect(computeTeamGoal([], null)).toBe(0);
  });

  it('soporta metas distintas por editor', () => {
    expect(computeTeamGoal([4, 6, 2], null)).toBe(12);
  });
});

describe('activeEditors', () => {
  it('excluye a los desactivados', () => {
    const activa = makeEditor({ active: true });
    const inactiva = makeEditor({ active: false });
    expect(activeEditors([activa, inactiva])).toEqual([activa]);
  });
});

describe('metas congeladas por día', () => {
  const editor = makeEditor({ dailyGoal: 5 });
  const ayer = isoDate('2026-11-11');
  const hoy = isoDate('2026-11-12');

  it('usa la meta vigente del editor cuando no hay snapshot', () => {
    expect(effectiveGoal(editor, hoy, indexDailyGoals([]))).toBe(5);
  });

  it('usa el snapshot del día cuando existe', () => {
    const index = indexDailyGoals([{ editorId: editor.id, date: ayer, goal: 4 }]);
    expect(effectiveGoal(editor, ayer, index)).toBe(4);
  });

  /** El punto de todo el mecanismo: subir la meta hoy no re-califica el pasado. */
  it('subir la meta hoy no cambia cómo se mide ayer', () => {
    const index = indexDailyGoals([
      { editorId: editor.id, date: ayer, goal: 4 },
      { editorId: editor.id, date: hoy, goal: 5 },
    ]);
    expect(effectiveGoal(editor, ayer, index)).toBe(4);
    expect(effectiveGoal(editor, hoy, index)).toBe(5);
  });

  it('un snapshot de 0 se respeta y no cae al default', () => {
    const index = indexDailyGoals([{ editorId: editor.id, date: hoy, goal: 0 }]);
    expect(effectiveGoal(editor, hoy, index)).toBe(0);
  });

  it('los snapshots de otro editor no se mezclan', () => {
    const otro = makeEditor({ dailyGoal: 9 });
    const index = indexDailyGoals([{ editorId: otro.id, date: hoy, goal: 1 }]);
    expect(effectiveGoal(editor, hoy, index)).toBe(5);
  });

  it('la clave distingue editor y fecha', () => {
    expect(goalKey(editor.id, hoy)).toBe(`${editor.id}|${hoy}`);
  });
});

describe('sortEditors', () => {
  it('ordena por sortOrder y desempata por nombre', () => {
    const b = makeEditor({ name: 'Bruno', sortOrder: 1 });
    const a = makeEditor({ name: 'Ana', sortOrder: 1 });
    const z = makeEditor({ name: 'Zoe', sortOrder: 0 });
    expect(sortEditors([b, a, z]).map((editor) => editor.name)).toEqual(['Zoe', 'Ana', 'Bruno']);
  });

  it('no muta el arreglo original', () => {
    const editors = [makeEditor({ sortOrder: 2 }), makeEditor({ sortOrder: 1 })];
    const originalFirst = editors[0];
    sortEditors(editors);
    expect(editors[0]).toBe(originalFirst);
  });
});
